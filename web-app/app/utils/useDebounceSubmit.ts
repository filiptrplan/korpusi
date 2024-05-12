import { SubmitFunction, useSubmit } from "@remix-run/react";
import { useEffect, useRef } from "react";

export const useDebounceSubmit = (delay: number): SubmitFunction => {
  const submit = useSubmit();

  const timeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, [timeout]);

  return (target, options) => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    timeout.current = setTimeout(() => {
      submit(target, options);
    }, delay);
  };
};
