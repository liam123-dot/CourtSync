CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)
TESTED_CONTAINERS=()

# loop through changed files in the ./backend/Containers directory that have Container in their name
for FILE in $CHANGED_FILES; do
if [[ $FILE == backend/Containers/*Container* ]]; then
    CONTAINER=$(echo $FILE | cut -d'/' -f3)
    if [[ ! " ${TESTED_CONTAINERS[@]} " =~ " ${CONTAINER} " ]]; then
    cd backend/Containers/$CONTAINER
    pytest
    TESTED_CONTAINERS+=($CONTAINER)
    cd ../../..
    fi
fi
done
