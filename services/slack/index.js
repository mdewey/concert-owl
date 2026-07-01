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
    const resp = await axios.post(slackUrl, slackData);
    console.log('Slack response:', {
      status: resp.status,
      statusText: resp.statusText,
      data: resp.data,
    });
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

const postRecommendations = async ({
  recommendations,
  slackUrl = process.env.RECOMMENDATIONS_SLACK_URL,
}) => {
  const slackData = {
    'blocks': [
      {
        'type': 'header',
        'text': {
          'type': 'plain_text',
          'text': '🎵 Shows matching your vibe',
          'emoji': true,
        },
      },
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text':
            `<!channel> ${recommendations.length} upcoming ` +
            `show(s) that fit your Spotify vibe:`,
        },
      },
      { 'type': 'divider' },
      ...recommendations.map((r) => ({
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text':
            `*${r.artist}* at ${r.venue} — ${r.date}` +
            (r.reason ? `\n_${r.reason}_` : ''),
        },
      })),
      { 'type': 'divider' },
    ],
  };
  const resp = await axios.post(slackUrl, slackData);
  console.log('Slack (recommendations) response:', {
    status: resp.status,
    statusText: resp.statusText,
  });
};

/** Post a plain text message (used for ops alerts). */
const postMessage = async ({ text, slackUrl = process.env.SLACK_URL }) => {
  await axios.post(slackUrl, { text });
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

export {
  postShows,
  postRecommendations,
  postMessage,
  postTestToSlack,
  batchShows,
};
