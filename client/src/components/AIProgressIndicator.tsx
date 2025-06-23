import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Stack,
  Chip,
  Card,
  CardContent,
  Collapse,
  IconButton,
  Alert,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  AutoAwesome,
  CheckCircle,
  Error,
  Refresh,
} from '@mui/icons-material';
import { useAIProgress } from '@/contexts/AIProgressContext';

interface AIProgressIndicatorProps {
  showDetails?: boolean;
  compact?: boolean;
}

export function AIProgressIndicator({ showDetails = true, compact = false }: AIProgressIndicatorProps) {
  const { state, reset } = useAIProgress();
  const [expanded, setExpanded] = React.useState(showDetails);

  if (!state.isGenerating && state.completedTasks === 0 && !state.error) {
    return null;
  }

  const getStatusColor = () => {
    if (state.error) return 'error';
    if (!state.isGenerating && state.completedTasks > 0) return 'success';
    return 'primary';
  };

  const getStatusIcon = () => {
    if (state.error) return <Error />;
    if (!state.isGenerating && state.completedTasks > 0) return <CheckCircle />;
    return <AutoAwesome className="animate-pulse" />;
  };

  if (compact) {
    return (
      <Box sx={{ width: '100%', mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
          {getStatusIcon()}
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {state.currentTask}
          </Typography>
          <Chip 
            label={`${state.completedTasks}/${state.totalTasks}`} 
            size="small" 
            color={getStatusColor()}
          />
        </Stack>
        <LinearProgress 
          variant="determinate" 
          value={state.progress} 
          color={getStatusColor()}
          sx={{ height: 6, borderRadius: 3 }}
        />
      </Box>
    );
  }

  return (
    <Card sx={{ mb: 2, border: `2px solid ${state.error ? '#f44336' : '#1976d2'}` }}>
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              {getStatusIcon()}
              <Typography variant="h6" fontWeight={600}>
                {state.error ? 'AI Generation Failed' : 
                 state.isGenerating ? 'AI Enhancement in Progress' : 
                 'AI Enhancement Complete'}
              </Typography>
            </Stack>
            
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip 
                label={`${state.completedTasks}/${state.totalTasks} Tasks`}
                color={getStatusColor()}
                size="small"
              />
              {showDetails && (
                <IconButton 
                  size="small" 
                  onClick={() => setExpanded(!expanded)}
                  sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <ExpandMore />
                </IconButton>
              )}
            </Stack>
          </Stack>

          {/* Progress Bar */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {state.currentTask}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(state.progress)}%
              </Typography>
            </Stack>
            <LinearProgress 
              variant="determinate" 
              value={state.progress} 
              color={getStatusColor()}
              sx={{ 
                height: 8, 
                borderRadius: 4,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  transition: 'transform 0.4s ease',
                }
              }}
            />
          </Box>

          {/* Error Display */}
          {state.error && (
            <Alert 
              severity="error" 
              action={
                <IconButton size="small" onClick={reset} color="inherit">
                  <Refresh />
                </IconButton>
              }
            >
              {state.error}
            </Alert>
          )}

          {/* Details */}
          {showDetails && (
            <Collapse in={expanded}>
              <Box sx={{ maxHeight: 200, overflowY: 'auto', bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Progress Details:
                </Typography>
                <Stack spacing={0.5}>
                  {state.details.map((detail, index) => (
                    <Typography 
                      key={index} 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                      }}
                    >
                      {detail}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            </Collapse>
          )}

          {/* Completion Message */}
          {!state.isGenerating && state.completedTasks > 0 && !state.error && (
            <Alert severity="success">
              <strong>AI enhancement completed!</strong> All text fields have been processed and enhanced.
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}