import { flushSync } from "react-dom";
import React, { useEffect, useLayoutEffect, useRef } from "react";

// Native editing stays synchronous, but the rest of the app and browser storage
// update only after a pause/blur. Flush on close so the last edit is not lost.
export default function BufferedTextarea({ value = "", onCommit, ...props }) {
  const input = useRef(null),
    timer = useRef(null),
    dirty = useRef(false),
    callback = useRef(onCommit),
    latest = useRef(value);
  callback.current = onCommit;
  const flush = () => {
    clearTimeout(timer.current);
    if (dirty.current) {
      dirty.current = false;
      callback.current(latest.current);
    }
  };
  const flushRef = useRef(flush);
  flushRef.current = flush;
  useEffect(() => {
    if (!dirty.current && input.current.value !== value) {
      input.current.value = value;
      latest.current = value;
    }
  }, [value]);
  useLayoutEffect(() => {
    const beforeUnload = () => flushSync(() => flushRef.current());
    window.addEventListener("pagehide", beforeUnload);
    const commitAll = () => flushRef.current();
    window.addEventListener("chatter-flush-inputs", commitAll);
    return () => {
      flushRef.current();
      window.removeEventListener("pagehide", beforeUnload);
      window.removeEventListener("chatter-flush-inputs", commitAll);
      clearTimeout(timer.current);
    };
  }, []);
  return (
    <textarea
      {...props}
      ref={input}
      defaultValue={value}
      onChange={(e) => {
        latest.current = e.target.value;
        dirty.current = true;
        clearTimeout(timer.current);
        timer.current = setTimeout(flush, 500);
      }}
      onBlur={flush}
    />
  );
}
