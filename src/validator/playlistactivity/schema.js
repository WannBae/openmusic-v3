const InvariantError = require("../../exceptions/InvariantError");
const { ActivityPayloadSchema } = require("./schema");

class ActivitiesValidator {
  validateActivityPayload = (payload) => {
    const validationResult = ActivityPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }

    return validationResult.value;
  };
}

module.exports = { ActivitiesValidator };
