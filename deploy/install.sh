#!/usr/bin/env bash
#
# Install (or update) the Concert Owl systemd timers on the Raspberry Pi.
# Run from anywhere with sudo:
#
#   sudo bash deploy/install.sh
#
# Idempotent: copies the unit files, reloads systemd, and enables the timers.
set -euo pipefail

UNIT_SRC="$(cd "$(dirname "$0")/systemd" && pwd)"
UNIT_DST="/etc/systemd/system"

TIMERS=(concert-owl-weekly concert-owl-upcoming concert-owl-recommend)

echo "Installing units from $UNIT_SRC -> $UNIT_DST"
install -m 644 "$UNIT_SRC"/*.service "$UNIT_SRC"/*.timer "$UNIT_DST"/

echo "Reloading systemd..."
systemctl daemon-reload

for t in "${TIMERS[@]}"; do
  echo "Enabling $t.timer"
  systemctl enable --now "$t.timer"
done

echo
echo "Installed. Scheduled runs:"
systemctl list-timers 'concert-owl-*' --all --no-pager
