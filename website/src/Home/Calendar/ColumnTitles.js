
export default function ColumnTitles({ titles, dayView }) {
    const titleStyle = {
        border: '1px solid rgba(0,0,0,1)',
        padding: '5px',
        textAlign: 'center',
        minWidth: '120px',
        flex: dayView ? 7: 1,
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            width: `${100 / titles.length}%`,
        }}>
            <div style={{
                border: '1px solid rgba(0,0,0,1)',
                padding: '5px',
                textAlign: 'center',
                minWidth: '120px',
                width: `${100 / titles.length}%`,
                flex: 1
            }}></div>
            {
                Object.values(titles).map((title, index) => (
                    <div style={titleStyle} key={index}>
                        <p>{title}</p>
                    </div>
                ))
            }
        </div>
    );
}
