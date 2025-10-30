import { Box, Typography } from "@mui/material"

export default function Contact() {
    return <div>
        <Box bgcolor={"primary.100"} width="100vw" padding={"50px"}>
            <Typography variant="h2" component="h1" gutterBottom color={"secondary.700"}>
                Contactpagina
            </Typography>
            <Typography variant="body1">
                Neem contact met ons op via email:
                <a href="mailto:info@petalbid.com">info@petalbid.com</a>
            </Typography>
            <Typography variant="body1">
                Of bel ons op: +31 6 123 4567
            </Typography>
        </Box>
    </div>
}