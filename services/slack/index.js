const axios = require('axios');

const postShows = async ({
  shows,
  title = `There are ${shows.length} new shows!`,
  totalShows,
}) => {
  const slackUrl = process.env.SLACK_URL;

  const slackData = {
    'text': title,
    'blocks': [
      {
        'type': 'header',
        'text': {
          'type': 'plain_text',
          'text': 'What did the Owl find?',
        },
      },
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': `<!channel>, ${title} `,
        },
      }, {
        'type': 'divider',
      },
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': `Total shows this year: ${totalShows}`,
        },
      }, {
        'type': 'divider',
      },
      ...shows.map((show) => {
        return {
          'type': 'section',
          'text': {
            'type': 'mrkdwn',
            'text': `*${show}*`,
          },
        };
      }),
      {
        'type': 'divider',
      }, {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': `Dance like the owl is watching.`,
        },
      },
      { 'type': 'divider' },
    ],
  };
  await axios.post(slackUrl, slackData);
};


const postTestToSlack = async () => {
  const slackUrl = process.env.SLACK_URL;
  const slackData = {
    'text': `Hello:world!`,
    'blocks': [
      {
        'type': 'header',
        'text': {
          'type': 'plain_text',
          'text': 'Error',
          'emoji': true,
        },
      }, {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': `Hello. there!`,
        },
      }, {
        'type': 'divider',
      },


    ],
  };
  await axios.post(slackUrl, slackData);
};

module.exports = {
  postShows,
  postTestToSlack,
};
