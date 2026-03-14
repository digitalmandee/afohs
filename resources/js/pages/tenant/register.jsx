import { useForm } from '@inertiajs/react';
import { Box, Button, CircularProgress, MenuItem, Paper, TextField, Typography } from '@mui/material';
import { enqueueSnackbar } from 'notistack';


const Register = ({ tenant, branches }) => {
    // const [open, setOpen] = useState(true);
    const isEdit = !!tenant;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: tenant?.name || '',
        branch_id: tenant?.branch_id ? String(tenant.branch_id) : '',
        printer_ip: tenant?.printer_ip || '',
        printer_port: tenant?.printer_port || '',
    });

    const submit = (e) => {
        e.preventDefault();

        if (isEdit) {
            put(route('locations.update', tenant.id), {
                preserveScroll: true,
                onSuccess: () => enqueueSnackbar('Tenant updated successfully!', { variant: 'success' }),
            });
        } else {
            post(route('locations.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    enqueueSnackbar('Restaurant created successfully!', { variant: 'success' });
                    reset(['name', 'branch_id', 'printer_ip', 'printer_port']);
                },
            });
        }
    };

    return (
        <>
            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'all 0.3s ease',
                }}
            > */}
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: "#f5f5f5",
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '20px',
                }}
            >
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    // maxWidth: '600px',
                    justifyContent: 'flex-start',
                    mb: 2,
                    mt: 2
                }}>
                    {/* <IconButton onClick={() => window.history.back()} sx={{ color: '#000' }}>
                        <ArrowBack />
                    </IconButton> */}
                    <Typography style={{ color: '#063455', fontWeight: 700, fontSize:'30px' }}>
                        {isEdit ? 'Update Restaurant' : 'Create New Restaurant'}
                    </Typography>
                </Box>
                <Paper sx={{ p: 3, maxWidth: '600px', width: '100%' }}>
                    <form onSubmit={submit}>
                        {/* Name */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <TextField label="Name" type="text" required fullWidth autoFocus autoComplete="name" value={data.name} onChange={(e) => setData('name', e.target.value)} disabled={processing} placeholder="Full name" error={!!errors.name} helperText={errors.name} variant="outlined" />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <TextField
                                select
                                label="Company"
                                required
                                fullWidth
                                value={data.branch_id}
                                onChange={(e) => setData('branch_id', e.target.value)}
                                disabled={processing}
                                error={!!errors.branch_id}
                                helperText={errors.branch_id}
                                variant="outlined"
                            >
                                {(Array.isArray(branches) ? branches : []).map((b) => (
                                    <MenuItem key={b.id} value={String(b.id)}>
                                        {b.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <TextField label="Printer IP*" fullWidth placeholder="e.g. 192.168.1.100" name="printer_ip" value={data.printer_ip} onChange={(e) => setData('printer_ip', e.target.value)} error={!!errors.printer_ip} helperText={errors.printer_ip} />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <TextField label="Printer Port*" fullWidth placeholder="e.g. 9100" name="printer_port" value={data.printer_port} onChange={(e) => setData('printer_port', e.target.value)} error={!!errors.printer_port} helperText={errors.printer_port} />
                        </div>

                        {/* Submit */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Button type="submit" variant="contained" sx={{ backgroundColor: '#063455', textTransform: 'none' }} disabled={processing} fullWidth>
                                {processing && <CircularProgress size={24} style={{ marginRight: '10px' }} />}
                                {isEdit ? 'Update Restaurant' : 'Create Restaurant'}
                            </Button>
                        </div>
                    </form>
                </Paper>
            </div >
            {/* </div> */}
        </>
    );
};

export default Register;
