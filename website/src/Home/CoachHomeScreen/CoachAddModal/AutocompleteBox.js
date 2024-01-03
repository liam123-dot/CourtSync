import { Autocomplete, TextField } from "@mui/material";

export default function AutocompleteBox({ options, value, setValue, label}) {

    return (
        <Autocomplete
            options={options}
            value={value}
            onChange={(event, newValue) => {
                setValue(newValue);
            }}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => <TextField {...params} label="Search Players" />}
            sx={{
                width: '100%',
                mt: 2
            }}
        />
    )

}
