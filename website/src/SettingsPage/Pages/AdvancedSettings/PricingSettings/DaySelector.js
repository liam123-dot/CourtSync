export default function DaySelector({valid, letter, selected, setSelected}) {
    const handleClick = () => {
        setSelected(!selected);
    };

    const buttonStyle = {
        borderRadius: '50%',
        backgroundColor: selected ? 'blue' : 'transparent',
        color: selected ? 'white' : 'black',
        padding: '10px',
        border: 'none',
        cursor: 'pointer',
    };

    return (
        <button style={buttonStyle} onClick={handleClick}>
            {letter}
        </button>
    );
}