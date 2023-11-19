function Option({ label, onClick, isSelected }) {
    return (
        <div onClick={onClick} style={{ padding: 10, backgroundColor: isSelected ? 'lightgray' : 'white', cursor: 'pointer' }}>
            {label}
        </div>
    );
}

export default function SideBar({ setSelectedOption, selectedOption, OPTIONS }) {
    return (
        <div style={{
            flex: 1,
            border: '1px solid #000',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {OPTIONS.map(option => (
                <Option 
                    key={option.label} 
                    label={option.label} 
                    onClick={() => setSelectedOption(option)} 
                    isSelected={selectedOption === option} 
                />
            ))}
        </div>
    );
}