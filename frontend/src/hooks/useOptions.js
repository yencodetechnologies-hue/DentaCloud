import { useEffect, useState } from "react";
import api from "../api/client.js";

/**
 * Load a list resource and map it into [{value,label}] options.
 * @param {string} endpoint
 * @param {(item)=>{value:string,label:string}} mapFn
 */
export default function useOptions(endpoint, mapFn) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    let active = true;
    api
      .get(`/${endpoint}`, { params: { limit: 200 } })
      .then(({ data }) => {
        if (active) setOptions(data.data.map(mapFn));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [endpoint]);

  return options;
}
