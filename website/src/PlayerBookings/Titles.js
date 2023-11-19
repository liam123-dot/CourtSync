export default function Titles ({titles}) {

    return (
        <div style={{
            borderTop: '2px solid #000',
            display: 'flex',
            alignItems: 'center', // Align items vertically
            padding: '5px 0', // Increase padding for visual comfort
        }}>
            {
                titles.map((title) => (
                        <div style={{
                            flex: 1,
                            padding: '0 10px', // Added padding for better spacing                            
                        }}>
                            {title}
                        </div>
                    )
                )
            }
        </div>
    )
}
