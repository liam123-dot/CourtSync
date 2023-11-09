CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)
echo $CHANGED_FILES
TESTED_CONTAINERS=()

for FILE in $CHANGED_FILES; do
if [[ $FILE == backend/Containers/*Container* ]]; then
        CONTAINER=$(echo $FILE | cut -d'/' -f3)
        if [[ ! " ${PUSHED_CONTAINERS[@]} " =~ " ${CONTAINER} " ]]; then
            cd backend/Containers/$CONTAINER

            container_name=$(echo $CONTAINER | sed 's/Container//g' | tr '[:upper:]' '[:lower:]')
            echo $container_name
            container_name="timetable-container"
                        - name: Install jq
                uses: appleboy/setup-apt@v2
                with:
                    update: true
                    packages: j
            LATEST_TAG=$(curl -s https://registry.hub.docker.com/v2/repositories/tennisdockerimages/$container_name/tags | jq -r '.results[].name' | grep -oE '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -n1)

            echo $LATEST_TAG
            NEW_TAG=$(echo $LATEST_TAG | awk -F. -v OFS=. '{$NF = $NF + 1; print}')

            echo $NEW_TAG
fi
fi
done