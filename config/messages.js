module.exports.messages = {
  // About Auth Error Messages
  QUERIER: {},
  // About Auth Error Messages
  AUTH: {
    VERIFICATION_TOKEN_NOT_EXISTS: (extra) =>
      JSON.stringify({
        message: 'BadRequest.Auth.Verification.Token.Not.Exists',
        code: 400,
        extra,
      }),
    STRATEGY_NOT_EXISTS: (extra) =>
      JSON.stringify({
        message: 'BadRequest.Auth.Strategy.Not.Exists',
        code: 400,
        extra,
      }),
    USER_NOT_FOUND: (extra) =>
      JSON.stringify({
        message: 'Forbidden.Auth.User.Not.Found',
        code: 403,
        extra,
      }),
    USERNAME_HAS_EXISTED: (extra) =>
      JSON.stringify({
        message: 'BadRequest.Auth.Username.Has.Existed',
        code: 400,
        extra,
      }),
    EMAIL_HAS_EXISTED: (extra) =>
      JSON.stringify({
        message: 'BadRequest.Auth.Email.Has.Existed',
        code: 400,
        extra,
      }),
    INVALID_PASSWORD: (extra) =>
      JSON.stringify({
        message: 'Forbidden.Auth.Invalid.Password',
        code: 403,
        extra,
      }),
    EMPTY_PASSWORD: (extra) =>
      JSON.stringify({
        message: 'Forbidden.Auth.Empty.Password',
        code: 403,
        extra,
      }),
    USER_SUSPENDS: (extra) =>
      JSON.stringify({
        message: 'Unauthorized.Auth.User.Suspends',
        code: 401,
        extra,
      }),
    USER_NO_PERMISSION: (extra) =>
      JSON.stringify({
        message: 'Unauthorized.Auth.User.No.Permission',
        code: 401,
        extra,
      }),
    NO_USER_LOGIN: (extra) =>
      JSON.stringify({
        message: 'Forbidden.Auth.No.User.Login',
        code: 403,
        extra,
      }),
    TOKEN_EXPIRED: (extra) =>
      JSON.stringify({
        message: 'Forbidden.Auth.Token.Expired',
        code: 401,
        extra,
      }),
    TOKEN_INVALID: (extra) =>
      JSON.stringify({
        message: 'Forbidden.Auth.Token.Invalid',
        code: 401,
        extra,
      }),
    USER_PASSWORD_NOT_SET: (extra) =>
      JSON.stringify({
        message: 'BadRequest.Auth.User.Local.Password.Not.Set',
        code: 400,
        extra,
      }),
    REGISTER_SUCCESS: (extra) =>
      JSON.stringify({
        message: 'Success.Auth.Register.Successful',
        code: 200,
        extra,
      }),
    LOGIN_SUCCESS: (extra) =>
      JSON.stringify({
        message: 'Success.Auth.Login.Successful',
        code: 200,
        extra,
      }),
    USER_ACCESS_DENIED: (extra) =>
      JSON.stringify({
        message: 'Forbidden.Auth.User.Access.Denied',
        code: 403,
        extra,
      }),
  },

  INFO: {
    AUTH_ALREADY_LOGOUT: 'Info.Auth.No.User.Login',
  },

  WARNING: {},

  SUCCESS: {
    AUTH_LOGOUT_SUCCESS: 'Success.Auth.Logout',
  },

  FORBIDDEN: {},

  UNAUTHORIZED: {},

  BAD_REQUEST: {
    // NO_TARGET_FOUNDED: (e = '') => `Error.No.Target.Founded|(${e})`,
    NO_TARGET_FOUNDED: (extra) =>
      JSON.stringify({
        message: 'BadRequest.No.Target.Founded',
        code: 400,
        extra,
      }),

    // MODEL_NOT_EXISTS: (e = '') => `Target.Model.Not.Exits|(${e})`,
    MODEL_NOT_EXISTS: (extra) =>
      JSON.stringify({
        message: 'BadRequest.Target.Model.Not.Exits',
        code: 400,
        extra,
      }),

    // NO_REQUIRED_PARAMETER: (e = '') => `No.Required.Or.Valid.Parameter|(${e})`,
    NO_REQUIRED_PARAMETER: (extra) =>
      JSON.stringify({
        message: 'BadRequest.No.Required.Or.Valid.Parameter',
        code: 400,
        extra,
      }),

    PARAMETER_FORMAT_INVALID: (extra) =>
      JSON.stringify({
        message: 'BadRequest.Parameter.Format.Invalid',
        code: 400,
        extra,
      }),

    // CHECK_INPUT_PARAMETER_TYPE: (e = '', type = '') => `Check.Input.Parameter.Type|(${e}${e && type ? ':' : ''}${type}')`,
    CHECK_INPUT_PARAMETER_TYPE: (extra) =>
      JSON.stringify({
        message: 'BadRequest.Check.Input.Parameter.Type',
        code: 400,
        extra,
      }),

    // TARGET_DELETED_OR_NOT_EXIST: (e = '') => `Target.Deleted.Or.Not.Exists|(${e})`,
    TARGET_DELETED_OR_NOT_EXIST: (extra) =>
      JSON.stringify({
        message: 'BadRequest.Target.Deleted.Or.Not.Exists',
        code: 400,
        extra,
      }),

    // UNIQUE_CONSTRAINT_ERROR: (e = '') => `BAD_REQUEST.Field.Must.Be.Unique|(${e})`,
    UNIQUE_CONSTRAINT_ERROR: (extra) =>
      JSON.stringify({
        message: 'BadRequest.Field.Must.Be.Unique',
        code: 400,
        extra,
      }),

    // NO_DESTROY_SELF: (e = '') => `BAD_REQUEST.No.Destroy.Self.Account|(${e})`,
    NO_DESTROY_SELF: (extra) =>
      JSON.stringify({
        message: 'BadRequest.No.Destroy.Self.Account',
        code: 400,
        extra,
      }),

    // NO_DESTROY_DEFAULT_ACCOUNT: (e = '') => `BAD_REQUEST.No.Destroy.Default.Account|(${e})`,
    NO_DESTROY_DEFAULT_ACCOUNT: (extra) =>
      JSON.stringify({
        message: 'BadRequest.No.Destroy.Default.Account',
        code: 400,
        extra,
      }),
  },

  ERROR: {
    VALIDATION_FAILED: (extra) =>
      JSON.stringify({
        message: 'Error.Validation.Failed',
        code: 500,
        extra,
      }),
  },
};
