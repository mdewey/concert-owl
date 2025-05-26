import axios from 'axios';

const postShows = async ({
  shows,
  title = `There are ${shows.length} new shows!`,
  totalShows,
  slackUrl = process.env.SLACK_URL,
}) => {
  const batched = batchShows({ shows });

  for (const batch of batched) {
    const slackData = {
      'blocks': [
        {
          'type': 'header',
          'text': {
            'type': 'plain_text',
            'text': 'What did the Owl find?',
          },
        },
        {
          'type': 'header',
          'text': {
            'type': 'plain_text',
            'text': title,
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
        ...batch.map((show) => {
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
  }
};


const batchShows = ({ shows }) => {
  const split = 40;
  const rv = shows.reduce((acc, show, i) => {
    const index = Math.floor(i / split);
    if (!acc[index]) {
      acc[index] = [];
    }
    acc[index].push(show);
    return acc;
  }, []);
  return rv;
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

export { postShows, postTestToSlack, batchShows };
