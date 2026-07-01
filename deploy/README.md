# Deploy — systemd timers (Raspberry Pi)

Replaces the hand-managed crontab with systemd timers. Benefits over cron:
missed runs are caught (`Persistent=true`), logs go to the journal, status is
visible via `systemctl list-timers`, and failures post to Slack.

## Jobs

| Timer                      | Schedule       | Script              |
| -------------------------- | -------------- | ------------------- |
| `concert-owl-weekly`       | Mon 13:00      | `weekly.v2.js`      |
| `concert-owl-upcoming`     | Wed 13:00      | `upcoming.v2.js`    |
| `concert-owl-recommend`    | Mon 13:00      | `recommend.v2.js`   |

`concert-owl-alert@.service` is a template unit fired via `OnFailure=`; it runs
`scripts/alert.js`, which posts to `ALERT_SLACK_URL` (falling back to
`SLACK_URL`).

The paths in the unit files are hardcoded for this Pi:
- node: `/home/dewey/.nvm/versions/node/v21.7.1/bin/node`
- repo: `/home/dewey/projects/concert-owl`
- user: `dewey`

If any of those change, update the `.service` files and re-run the installer.

## Install / update

```sh
sudo bash deploy/install.sh
```

Then remove the old app entries from crontab (`crontab -e`) — keep the nightly
reboot if you still want it:

```cron
# delete these two:
0 13 * * 1 .../weekly.v2.js  ...
0 13 * * 3 .../upcoming.v2.js ...
```

## Operate

```sh
# See next/last run for all Concert Owl timers
systemctl list-timers 'concert-owl-*' --all

# Run a job now, on demand (no need to wait for the schedule)
sudo systemctl start concert-owl-weekly.service

# Tail logs for a job
journalctl -u concert-owl-weekly -f

# Test the failure alert path
sudo systemctl start concert-owl-alert@concert-owl-weekly.service

# Disable a job
sudo systemctl disable --now concert-owl-recommend.timer
```

## Change a schedule

Edit the `OnCalendar=` line in the relevant `.timer`, then re-run the installer
(or `sudo systemctl daemon-reload && sudo systemctl restart <name>.timer`).
Validate an expression with:

```sh
systemd-analyze calendar "Fri *-*-* 13:00:00"
```
