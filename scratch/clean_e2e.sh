#!/bin/bash
IP="164.52.213.234"
KEYS=("id_rsa_medisync_e2e" "id_ed25519")
USERS=("ubuntu" "root" "admin" "studies" "debian")

for KEY in "${KEYS[@]}"; do
    for USER in "${USERS[@]}"; do
        echo "Trying $USER with $KEY..."
        ssh -i ~/.ssh/$KEY -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${USER}@${IP} "rm -rf ~/Medisync && echo 'CLEANED'" 2>&1
        if [ $? -eq 0 ]; then
            echo "SUCCESS: $USER@$IP cleaned with $KEY"
            exit 0
        fi
    done
done
echo "FAILED: Could not connect to E2E server with available credentials."
exit 1
