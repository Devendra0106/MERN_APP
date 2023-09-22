import { useState, useCallback, useRef, useEffect } from "react";

export const useHttpClient = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState();

	//To cancel on-going http request
	const activeHttpRequests = useRef([]);

	const sendRequest = useCallback(
		async (url, method = "GET", body = null, headers = {}) => {
			setIsLoading(true);
			const httpAbortCtrl = new AbortController();
			activeHttpRequests.current.push(httpAbortCtrl);

			try {
				const response = await fetch(url, {
					method,
					body,
					headers,
					signal: httpAbortCtrl.signal,
				});

				const responseData = await response.json();

				//We need to clear abort controller that belongs to a request which is just completed
				activeHttpRequests.current = activeHttpRequests.current.filter(
					(reqctrl) => reqctrl !== httpAbortCtrl
				);

				if (!response.ok) {
					throw new Error(responseData.message);
				}

				setIsLoading(false);
				return responseData;
			} catch (err) {
				setError(err.message);
				setIsLoading(false);
				throw err;
			}
		},
		[]
	);

	const clearError = () => {
		setError(null);
	};

	useEffect(() => {
		return () => {
			activeHttpRequests.current.forEach((abortCtrl) => abortCtrl.abort());
		};
	}, []);

	return { isLoading, error, sendRequest, clearError };
};
