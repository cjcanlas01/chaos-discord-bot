/**
 * Generate options for slash commands
 *
 * @param {object} collection
 * @param {callback} callback
 * @returns {object}
 */
const generateOptions = (collection, callback) => {
  const commands = [];
  for (const [key, value] of Object.entries(collection)) {
    commands.push(callback(key, value));
  }
  return commands;
};

/**
 * Compute request to get delivery count
 *
 * @param {object} bankDetail
 * @param {integer} resourceCount
 * @returns {string}
 */
const computeRequestCount = (bankDetail, resourceCount) => {
  const TAX_RATE = Number(bankDetail.transport_tax);
  const TRANSPORT_AMOUNT = Number(bankDetail.transport_amount);

  // Check if bank detail is missing
  if (!TAX_RATE || !TRANSPORT_AMOUNT) return false;

  // Compute delivery amount
  let deliverableAmount =
    TRANSPORT_AMOUNT - (TRANSPORT_AMOUNT * TAX_RATE) / 100;
  deliverableAmount = deliverableAmount.toString().slice(0, 3);
  deliverableAmount = Number((deliverableAmount / 100).toFixed(2));

  // Count how many times bank should hit transport
  const loadCount = (resourceCount / deliverableAmount).toFixed(2);

  // Separate full and last load count
  const [wholeNumber, decimalNumber] = loadCount.split(".");
  let decimalAmount = deliverableAmount * (decimalNumber / 100);
  decimalAmount = decimalAmount.toFixed(2);
  const decimalInMillions = decimalAmount * 1000000;
  // Place holder to complete computed value
  const MAGIC_AMOUNT = 10000;

  for (
    let lastLoad = decimalInMillions;
    lastLoad <= TRANSPORT_AMOUNT;
    lastLoad++
  ) {
    const findAmount = lastLoad - (lastLoad * TAX_RATE) / 100;
    /**
     * Find transport amount by
     * incrementing value from decimal value and
     * computing value with transport tax amount deducted
     * then compare to given decimal value
     */
    if (Math.trunc(findAmount) == Math.trunc(decimalInMillions)) {
      const isDivisbleToDeliverableAmount =
        wholeNumber * deliverableAmount == resourceCount ? true : false;

      if (isDivisbleToDeliverableAmount) {
        return `Send **${wholeNumber}** full loads.`;
      }

      lastLoad = lastLoad + MAGIC_AMOUNT;
      return `Send **${wholeNumber}** full loads and **${lastLoad}** for last load.`;
    }
  }
};

module.exports = {
  generateOptions,
  computeRequestCount,
};