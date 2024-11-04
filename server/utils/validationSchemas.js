const { body, query } = require('express-validator');

const observationValidation = {
  create: [
    body('date').isISO8601().withMessage('Invalid date format'),
    body('supervisorName').trim().isLength({ min: 1 }).escape().withMessage('Supervisor name is required'),
    body('shift').isInt({ min: 1, max: 3 }).withMessage('Shift must be between 1 and 3'),
    body('topic').trim().isLength({ min: 1 }).escape().withMessage('Topic is required'),
    // Make associateName conditional based on topic
    body('associateName').custom((value, { req }) => {
      if (req.body.topic !== 'Unsafe Condition' && (!value || value.trim().length === 0)) {
        throw new Error('Associate name is required for non-Unsafe Condition topics');
      }
      return true;
    }),
    body('actionAddressed').trim().isLength({ min: 1 }).escape().withMessage('Action addressed is required'),
    body('siteCode').optional().trim().isLength({ min: 1 }).escape()
  ],
  query: [
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    query('supervisorName').optional().trim().escape(),
    query('siteCode').optional().trim().escape()
  ]
};

module.exports = {
  observationValidation
};
