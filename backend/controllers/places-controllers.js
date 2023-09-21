const uuid = require("uuid/v4");
const { validationResult } = require("express-validator");

const HTTPError = require("../models/http-error");
const getCoordinatesForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");
const mongoose = require("mongoose");

const getPlaceById = async (req, res, next) => {
	const placeId = req.params.pid;
	let place;
	try {
		place = await Place.findById(placeId); //return obj
	} catch (err) {
		const error = new HTTPError(
			"Something went wrong, could not find place!",
			500
		);
		return next(error);
	}
	if (!place) {
		const error = new HTTPError(
			"Could not find a place for the provided id.",
			404
		);
		return next(error);
	}
	res.json({ place: place.toObject({ getters: true }) }); // { place: place } // with place.toObject() we are converting response to object and with { getters:true } help to get id(string) from _id(object).
};

const getPlacesByUserId = async (req, res, next) => {
	const userId = req.params.uid;
	let userWithPLaces;
	try {
		userWithPLaces = await User.findById(userId).populate("places");
	} catch (err) {
		const error = new HTTPError(
			"Fetching places failed, please try again later",
			500
		);
		return next(error);
	}
	if (!userWithPLaces || userWithPLaces.places.length === 0) {
		return next(
			new HTTPError("Could not find a places for the provided user id.", 404)
		);
	}
	res.json({
		places: userWithPLaces.places.map((place) =>
			place.toObject({ getters: true })
		),
	});
};

// const getPlacesByUserId = async (req, res, next) => {
//     const userId = req.params.uid;
//     let places;
//     try{
//       places = await Place.find({ creator: userId }); // returns array
//     }catch(err){
//       const error = new HTTPError('Fetching places failed, please try again later',500);
//       return next(error);
//     }
//     if(!places || places.length === 0){
//       return next(
//         new HTTPError('Could not find a places for the provided user id.', 404)
//       )
//     }
//     res.json({ places: places.map(place => place.toObject({ getters: true }))});
// }

// const getPlacesByUserId = (req, res, next) => {
//     const userId = req.params.uid;
//     const places = DUMMY_PLACES.filter(p => p.creator === userId);
//     if(!place || place.length === 0){
//       return next(
//         new HTTPError('Could not find a places for the provided user id.', 404)
//       )
//       // or -->
//       // const error = new Error('Could not find a place for the provided user id.');
//       // error.code = 404;
//       // return next(error);
//       // or -->
//       // return res.status(404).json({message: "Could not find a place for provided user id."});
//     }
//     res.json({ places });
// }

const createPlace = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			new HTTPError("Invalid inputs passed, please check your data.", 422)
		);
	}
	const { title, description, address, creator } = req.body;

	let coordinates;
	try {
		coordinates = await getCoordinatesForAddress(address);
	} catch (error) {
		next(error);
	}

	const createdPlace = new Place({
		title,
		description,
		address,
		location: coordinates,
		image:
			"https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/NYC_Empire_State_Building.jpg/640px-NYC_Empire_State_Building.jpg",
		creator,
	});

	let user;
	try {
		user = await User.findById(creator);
	} catch (err) {
		const error = new HTTPError(
			"Creating place failed, please try again.",
			500
		);
		return next(error);
	}

	if (!user) {
		const error = new HTTPError("Could not find user for provided id.", 404);
		return next(error);
	}

	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();
		await createdPlace.save({ session: sess });
		user.places.push(createdPlace);
		await user.save({ session: sess });
		await sess.commitTransaction();
	} catch (err) {
		const error = new HTTPError(
			"Creating place failed, please try again.",
			500
		);
		return next(error);
	}

	res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
	const errors = validationResult(req); //checks for properties added in middleware
	if (!errors.isEmpty()) {
		console.log(errors);
		return next(
			new HTTPError("Invalid inputs passed, please check your data.", 422)
		);
	}

	const { title, description } = req.body;
	const placeId = req.params.pid;

	let place;
	try {
		place = await Place.findById(placeId);
	} catch (err) {
		const error = new HTTPError(
			"Something went wrong, could not update place.",
			500
		);
		return next(error);
	}

	place.title = title;
	place.description = description;

	try {
		await place.save();
	} catch (err) {
		const error = new HTTPError(
			"Something went wrong, could not update place.",
			500
		);
		return next(error);
	}

	res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
	const placeId = req.params.pid;

	let place;
	try {
		place = await Place.findById(placeId).populate("creator");
	} catch (err) {
		const error = new HTTPError(
			"Something went wrong, could not delete place",
			500
		);
		return next(error);
	}

	if (!place) {
		const error = new HTTPError("Could not find place for this id.", 404);
		return next(error);
	}

	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();
		await place.remove({ session: sess });
		place.creator.places.pull(place);
		await place.creator.save({ session: sess });
		await sess.commitTransaction();
	} catch (err) {
		const error = new HTTPError(
			"Something went wrong, could not delete place",
			500
		);
		return next(error);
	}

	res.status(200).json({ message: "Deleted place." });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
