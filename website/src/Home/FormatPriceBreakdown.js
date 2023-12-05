function formatPriceInPounds(pennies) {
    // Convert pennies to pounds by dividing by 100 and fixing to 2 decimal places
    const pounds = (pennies / 100).toFixed(2);
    // Return the formatted string with the GBP symbol
    return `£${pounds}`;
}

export const formatPriceBreakdown = rules => {

    if (!rules) return null;
    if (!rules.extra) return null;


    const priceBreakdown = rules.extra.map(rule => {
        return (
            <div>
                {rule.label} : {formatPriceInPounds(rule.rate)}
            </div>
        )
    })

    return (
        <div>
            Coach Hourly Rate:
            <div>
                {formatPriceInPounds(rules.hourly.rate)}
            </div>
            {priceBreakdown && priceBreakdown.length > 0 && (
                <>
                    Extra Costs:
                    {priceBreakdown}
                </>
            )}
        </div>
    )

}