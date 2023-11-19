# Find all Python files in the specified directory
python_files=$(find "backend" -type f -name "*.py" -not -path "*/.aws-sam/*")
overall_lines=0

# Initialize a counter variable
total_lines=0

# Loop through each Python file and count lines
for file in $python_files; do
    lines=$(wc -l < "$file")
    total_lines=$((total_lines + lines))
done

# Print the total number of lines
echo "Total lines in Python files: $total_lines"
overall_lines=$((overall_lines + total_lines))

# Find all Python files in the specified directory
python_files=$(find "website/src" -type f -name "*.js")

# Initialize a counter variable
total_lines=0

# Loop through each Python file and count lines
for file in $python_files; do
    lines=$(wc -l < "$file")
    total_lines=$((total_lines + lines))
done

overall_lines=$((overall_lines + total_lines))

# Print the total number of lines
echo "Total lines in JS files: $total_lines"
echo "Total lines written by you: $overall_lines"