/**
 * Helpers shared by the DynamoDB and JSON datastore implementations so the two
 * behave identically during the dual-write migration.
 */

/**
 * Expand a record whose `shows` is an array of strings ("date: artist at venue")
 * into an array of { date, artist, venue } objects. Used by getShowList when
 * called with convertToObject: true.
 */
export function convertToObjects(rv) {
  return {
    ...rv,
    shows: rv.shows.map((show) => {
      const [date, ...theRest] = show.split(':');
      const details = theRest.join(':');
      const [artist, venue] = details.split(' at ');
      if (!date || !details || !artist || !venue) {
        console.log('error parsing show', show);
      }
      return {
        date: date?.trim(),
        artist: artist?.trim(),
        venue: venue?.trim(),
      };
    }),
  };
}
