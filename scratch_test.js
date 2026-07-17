require('dotenv').config();
const { listReviewTasks } = require('./src/modules/editor/editorTaskReview.service.js');

(async () => {
  try {
    const filters = {
      offset: 0,
      limit: 10,
    };
    const result = await listReviewTasks(filters);
    console.log(result);
  } catch (error) {
    console.error("ERROR:", error.message);
  }
})();
