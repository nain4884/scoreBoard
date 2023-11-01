/**
 * Get the value of a query parameter from the current URL.
 * @param {string} paramName - The name of the query parameter.
 * @returns {string|null} The value of the query parameter or null if not found.
 */
const getQueryParam = (paramName) =>
  new URLSearchParams(window.location.search).get(paramName);

/**
 * Get an HTML element by its ID.
 * @param {string} id - The ID of the element to retrieve.
 * @returns {HTMLElement|null} The HTML element with the specified ID, or null if not found.
 */
const getById = (id) => document.getElementById(id);

/**
 * Get the selected value.
 * @param {string}- input type
 * @returns {string} - The selected value.
 */
const getRadioValue = (type) => {
  return document.querySelector(`input[name=${type}]:checked`).value;
};

/**
 * Debounce function to delay function execution.
 *
 * @param {Function} func - The function to be debounced.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} - The debounced function.
 */
const debounce = (func, delay = 1000) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};
