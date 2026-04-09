const joi = require("joi");

const ValidateCreatePost = (data) => {
  const schema = joi.object({
    content: joi.string().min(3).max(50).required(),
    mediaIds: joi.array().items(joi.string()).optional(),
  });

  return schema.validate(data);
};

module.exports = { ValidateCreatePost };
