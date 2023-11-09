# Find all Python files in the specified directory
python_files=$(find "backend" -type f -name "*.py")

# Initialize a counter variable
total_lines=0

# Loop through each Python file and count lines
for file in $python_files; do
    lines=$(wc -l < "$file")
    total_lines=$((total_lines + lines))
done

# Print the total number of lines
echo "Total lines in Python files: $total_lines"

# Find all Python files in the specified directory
python_files=$(find "website/src" -type f -name "*.js")

# Initialize a counter variable
total_lines=0

# Loop through each Python file and count lines
for file in $python_files; do
    lines=$(wc -l < "$file")
    total_lines=$((total_lines + lines))
done

# Print the total number of lines
echo "Total lines in JS files: $total_lines"
