import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ReportTemplateDialog, type ReportTemplate } from "@/components/ReportTemplateDialog";
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
  Divider,
  Link,
} from '@mui/material';
import {
  Add,
  Description,
  Edit,
  Delete,
  MoreVert,
  CalendarToday,
  Logout,
  HelpOutline,
  TrendingUp,
  Assessment,
} from '@mui/icons-material';

export default function DashboardTurboTax() {
  const { user } = useAuth();
  const logout = useLogout();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; reportId: string; reportTitle: string }>({
    open: false,
    reportId: '',
    reportTitle: '',
  });

  // Fetch reports
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
    // Navigate to wizard with selected template
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
      completed: { label: 'Complete', color: 'success' as const },
      draft: { label: 'In progress', color: 'warning' as const },
      in_review: { label: 'Review', color: 'info' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      color: 'default' as const 
    };
    
    return (
      <Chip 
        label={config.label} 
        color={config.color} 
        size="small" 
        sx={{ 
          fontWeight: 500,
          fontSize: '0.75rem',
        }}
      />
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <Box
        sx={{
          borderBottom: '1px solid #E8EAED',
          backgroundColor: '#FFFFFF',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <Container maxWidth="lg">
          <Stack 
            direction="row" 
            alignItems="center" 
            justifyContent="space-between"
            sx={{ py: 2 }}
          >
            <Typography 
              variant="h6" 
              fontWeight={600}
              sx={{ color: '#0070BA' }}
            >
              Engineering Reports
            </Typography>
            
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton
                size="small"
                sx={{ color: '#5E6C84' }}
                aria-label="Get help"
              >
                <HelpOutline />
              </IconButton>
              
              <Button
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{ 
                  textTransform: 'none',
                  color: '#2C3E50',
                  fontWeight: 500,
                }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#0070BA', mr: 1 }}>
                  {user?.name?.charAt(0) || user?.givenName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </Avatar>
                {user?.name || user?.givenName || user?.email?.split('@')[0]}
              </Button>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                  sx: { minWidth: 200, mt: 1 }
                }}
              >
                <Box px={2} py={1}>
                  <Typography variant="body2" fontWeight={600}>
                    {user?.name || user?.givenName || user?.email?.split('@')[0]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <Logout fontSize="small" sx={{ mr: 1 }} />
                  Sign out
                </MenuItem>
              </Menu>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 6 }}>
          <Typography 
            variant="h3" 
            fontWeight={500} 
            gutterBottom
            sx={{ color: '#2C3E50' }}
          >
            Welcome back, {user?.name || user?.givenName || user?.email?.split('@')[0]}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ color: '#5E6C84' }}
          >
            Create professional engineering reports with our guided workflow
          </Typography>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', py: 2 }}>
              <CardContent>
                <Typography variant="h4" fontWeight={600} color="primary">
                  {reports.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Reports
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', py: 2 }}>
              <CardContent>
                <Typography variant="h4" fontWeight={600} color="success.main">
                  {reports.filter(r => r.status === 'completed').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', py: 2 }}>
              <CardContent>
                <Typography variant="h4" fontWeight={600} color="warning.main">
                  {reports.filter(r => r.status === 'draft').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In Progress
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', py: 2 }}>
              <CardContent>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleCreateReport}
                  sx={{ 
                    backgroundColor: '#00AA3B',
                    '&:hover': {
                      backgroundColor: '#007A2A',
                    },
                  }}
                >
                  New Report
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Reports Section */}
        <Box>
          <Stack 
            direction="row" 
            alignItems="center" 
            justifyContent="space-between"
            sx={{ mb: 3 }}
          >
            <Typography 
              variant="h5" 
              fontWeight={500}
              sx={{ color: '#2C3E50' }}
            >
              Your Reports
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Assessment />}
              size="small"
            >
              View Analytics
            </Button>
          </Stack>

          {isLoadingReports ? (
            <Grid container spacing={3}>
              {[1, 2, 3].map((i) => (
                <Grid item xs={12} md={6} lg={4} key={i}>
                  <Card>
                    <CardContent>
                      <Skeleton variant="text" width="80%" height={32} />
                      <Skeleton variant="text" width="60%" height={24} />
                      <Skeleton variant="text" width="100%" height={20} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : reports.length === 0 ? (
            <Card sx={{ p: 6, textAlign: 'center', bgcolor: '#F8F9FA' }}>
              <Description sx={{ fontSize: 64, color: '#C1C7D0', mb: 2 }} />
              <Typography variant="h6" fontWeight={500} gutterBottom>
                No reports yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first engineering report to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateReport}
                sx={{ 
                  backgroundColor: '#00AA3B',
                  '&:hover': {
                    backgroundColor: '#007A2A',
                  },
                }}
              >
                Create Report
              </Button>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {reports.map((report: any) => (
                <Grid item xs={12} md={6} lg={4} key={report._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography variant="h6" fontWeight={500} sx={{ pr: 1, lineHeight: 1.3 }}>
                          {report.title || `Report ${report.projectId}`}
                        </Typography>
                        {getStatusChip(report.status)}
                      </Stack>
                      
                      <Stack spacing={1} sx={{ mb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CalendarToday sx={{ fontSize: 16, color: '#6B778C' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(report.createdAt)}
                          </Typography>
                        </Stack>
                        
                        <Typography variant="caption" color="text.secondary">
                          ID: {report.projectId}
                        </Typography>
                      </Stack>
                      
                      {report.googleDocId && (
                        <Chip 
                          label="Google Doc available" 
                          size="small" 
                          color="success" 
                          variant="outlined"
                        />
                      )}
                    </CardContent>
                    
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => handleEditReport(report._id)}
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      
                      {report.googleDocId && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Description />}
                          onClick={() => {
                            window.open(`https://docs.google.com/document/d/${report.googleDocId}/edit`, '_blank');
                          }}
                          sx={{ mr: 1 }}
                        >
                          View
                        </Button>
                      )}
                      
                      <IconButton
                        size="small"
                        onClick={() => setDeleteDialog({
                          open: true,
                          reportId: report._id,
                          reportTitle: report.title || `Report ${report.projectId}`
                        })}
                        sx={{ color: '#6B778C' }}
                      >
                        <MoreVert />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Help Section */}
        <Box sx={{ mt: 8, p: 4, bgcolor: '#F8F9FA', borderRadius: 2 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" fontWeight={500} gutterBottom>
                Need help getting started?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Our step-by-step wizard makes creating professional engineering reports easy.
              </Typography>
              <Link
                href="#"
                underline="always"
                sx={{ 
                  color: '#0070BA',
                  fontWeight: 500,
                }}
              >
                View tutorial
              </Link>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<HelpOutline />}
              >
                Contact Support
              </Button>
            </Grid>
          </Grid>
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
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, reportId: '', reportTitle: '' })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteReport} color="error" variant="contained">
            Delete
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