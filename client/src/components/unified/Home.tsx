import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ReportTemplateDialog, type ReportTemplate } from "@/components/ReportTemplateDialog";

// MUI imports
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Avatar,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  Chip,
  Stack,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Paper,
  Divider,
} from '@mui/material';
import {
  Add,
  Description,
  Engineering,
  Edit,
  Delete,
  ExpandMore,
  Logout,
  CalendarToday,
  RateReview,
} from '@mui/icons-material';

export default function Home(props?: any) {
  const { user } = useAuth();
  const logout = useLogout();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; reportId: string; reportTitle: string }>({
    open: false,
    reportId: '',
    reportTitle: '',
  });
  
  const { data: reports = [], isLoading: isLoadingReports, refetch: refetchReports } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/reports");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const handleLogout = () => {
    logout.mutate();
  };

  const handleCreateReport = () => {
    setTemplateDialogOpen(true);
  };

  const handleTemplateSelect = (template: ReportTemplate) => {
    setLocation(`/report-wizard?template=${template.id}`);
  };

  const handleEditReport = (reportId: string) => {
    setLocation(`/reports/${reportId}`);
  };

  const handleDeleteReport = async () => {
    try {
      await apiRequest("DELETE", `/api/reports/${deleteDialog.reportId}`);
      refetchReports();
      toast({
        title: "Report Deleted",
        description: `"${deleteDialog.reportTitle}" has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete report. Please try again.",
        variant: "destructive",
      });
    }
    setDeleteDialog({ open: false, reportId: '', reportTitle: '' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      completed: { label: 'Completed', color: 'success' as const },
      draft: { label: 'Draft', color: 'warning' as const },
      in_review: { label: 'In Review', color: 'info' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      color: 'default' as const 
    };
    
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* AppBar */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Engineering />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} color="primary">
                Engineering Suite
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Civil Engineering Documentation Platform
              </Typography>
            </Box>
          </Stack>

          <Button
            onClick={(e) => setAnchorEl(e.currentTarget)}
            endIcon={<ExpandMore />}
            sx={{ textTransform: 'none' }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </Avatar>
              <Box textAlign="left">
                <Typography variant="body2" fontWeight={600}>
                  {user?.fullName || user?.username}
                </Typography>
                {user?.isEngineer && (
                  <Chip label="Licensed Engineer" size="small" color="primary" sx={{ height: 20 }} />
                )}
              </Box>
            </Stack>
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: { minWidth: 240, mt: 1 }
            }}
          >
            <Box px={2} py={1}>
              <Typography variant="body2" fontWeight={600}>
                {user?.fullName || user?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <Logout fontSize="small" sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          py: { xs: 6, md: 8 },
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            fontWeight={700}
            gutterBottom
            sx={{ fontSize: { xs: '2rem', md: '3rem' } }}
          >
            Welcome back, <Box component="span" color="primary.main">{user?.firstName || user?.username}</Box>
          </Typography>
          <Typography variant="h5" color="text.secondary" fontWeight={400} gutterBottom>
            Streamline your civil engineering documentation with intelligent automation
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={handleCreateReport}
            sx={{ mt: 3 }}
          >
            Create New Report
          </Button>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Quick Actions */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={handleCreateReport}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.light', mx: 'auto', mb: 2 }}>
                  <Add fontSize="large" />
                </Avatar>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Create New Report
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start a new engineering report using our intelligent step-by-step wizard
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', cursor: 'pointer' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'grey.300', mx: 'auto', mb: 2 }}>
                  <Description fontSize="large" />
                </Avatar>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  My Reports
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  View and manage your saved engineering reports
                </Typography>
                <Button 
                  variant="outlined" 
                  sx={{ mt: 2 }}
                  onClick={() => document.getElementById('reports-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  View Reports ({reports.length})
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {user?.isEngineer && (
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', opacity: 0.7 }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Avatar sx={{ width: 64, height: 64, bgcolor: 'info.light', mx: 'auto', mb: 2 }}>
                    <RateReview fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Review Queue
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reports pending your engineering review and approval
                  </Typography>
                  <Button variant="outlined" disabled sx={{ mt: 2 }}>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* My Reports Section */}
        <Box id="reports-section">
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            My Reports
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
            Manage your saved engineering reports
          </Typography>

          {isLoadingReports ? (
            <Grid container spacing={3}>
              {[1, 2, 3].map((i) => (
                <Grid item xs={12} md={6} lg={4} key={i}>
                  <Card>
                    <CardContent>
                      <Skeleton variant="text" width="60%" height={32} />
                      <Skeleton variant="text" width="40%" height={24} />
                      <Skeleton variant="text" width="80%" height={20} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : reports.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Description sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                No Reports Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first engineering report to get started.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateReport}
              >
                Create New Report
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {reports.map((report: any) => (
                <Grid item xs={12} md={6} lg={4} key={report._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography variant="h6" fontWeight={600} sx={{ pr: 1 }}>
                          {report.title || `Report ${report.projectId}`}
                        </Typography>
                        {getStatusChip(report.status)}
                      </Stack>
                      
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Created {formatDate(report.createdAt)}
                        </Typography>
                      </Stack>
                      
                      <Typography variant="caption" color="text.secondary">
                        Project ID: {report.projectId}
                      </Typography>
                    </CardContent>
                    
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => handleEditReport(report._id)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color={report.googleDocId ? "success" : "inherit"}
                        startIcon={<Description />}
                        disabled={!report.googleDocId}
                        onClick={() => {
                          if (report.googleDocId) {
                            window.open(`https://docs.google.com/document/d/${report.googleDocId}/edit`, '_blank');
                          }
                        }}
                      >
                        {report.googleDocId ? "View Doc" : "No Doc"}
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteDialog({
                          open: true,
                          reportId: report._id,
                          reportTitle: report.title || `Report ${report.projectId}`
                        })}
                      >
                        <Delete />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, reportId: '', reportTitle: '' })}
      >
        <DialogTitle>Delete Report</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deleteDialog.reportTitle}"? 
            This action cannot be undone and will permanently remove the report and all its data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, reportId: '', reportTitle: '' })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteReport} color="error" variant="contained">
            Delete Report
          </Button>
        </DialogActions>
      </Dialog>

      <ReportTemplateDialog 
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        onTemplateSelect={handleTemplateSelect}
      />
    </Box>
  );
}