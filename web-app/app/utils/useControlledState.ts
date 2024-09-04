import { useEffect, useState } from "react";
/**
 * This is a simple wrapper around useState that allows you to set the initial value
 * and synchronize the state when the default value changes. This is useful for
 * synchronizing the state with the URL.
 * @param value The default value
 */
export const useControlledState = <T>(value: T) => {
  const [state, setState] = useState<T>(value);

  useEffect(() => {
    setState(value);
  }, [JSON.stringify(value)]); // we stringify the value so we can compare objects

  return [state, setState] as const;
};
