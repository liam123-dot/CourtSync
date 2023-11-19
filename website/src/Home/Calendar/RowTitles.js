
export default function RowTitles({ titles, columnN }) {
    const titleStyle = {
        padding: '5px',
        minWidth: '120px',
        textAlign: 'center',
        flex: 1,
        border: '0.5px solid rgba(0,0,0,1)',
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: `${100.0 / columnN}%`,
            minWidth: '120px',
            flex: 1
        }}>
            {
                titles.map((title, index) => (
                    <div style={titleStyle} key={index}>
                        <p>{title}</p>
                    </div>
                ))
            }
        </div>
    );
}
