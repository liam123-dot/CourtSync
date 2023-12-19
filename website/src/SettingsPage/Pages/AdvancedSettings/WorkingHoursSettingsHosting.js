
import { useSettingsLabels } from "../../SettingsPage2";
import WorkingHoursSettings from "./WorkingHours";

export default function WorkingHoursSettingsHosting() {

    const {refreshLabels} = useSettingsLabels();

    return (
        <WorkingHoursSettings refreshLabels={refreshLabels}/>
    )

}
