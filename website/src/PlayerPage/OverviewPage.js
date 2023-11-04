import react, {useState} from "react";
import PlayerView from "./PlayerView";
import InvoiceView from "./InvoiceView";
import {Button} from "./Button"


export default function OverviewPage({}) {

    const [view, setView] = useState('invoices')

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column'
        }}>

            <div style={{
                flex: 1,
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'row'
            }}>

                <h1>Overview</h1>

                <Button selected={view==='players'} onClick={() => setView('players')}>Players</Button>
                <Button selected={view==='invoices'} onClick={() => setView('invoices')}>Invoices</Button>


            </div>

            <div style={{
                flex: 9,
                height: '100%',
                width: '100%',
                display: 'flex',
            }}>

                {
                    view === 'players' ? (
                        <PlayerView/>
                    ): (
                        <InvoiceView/>
                    )
                }

            </div>

        </div>
    )

}
