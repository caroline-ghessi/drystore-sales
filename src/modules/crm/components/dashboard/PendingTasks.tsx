import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, AlertCircle, Sparkles, Phone, FileText, Users } from 'lucide-react';
import { useOpportunities } from '../../hooks/useOpportunities';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  dueInfo: string;
  type: 'overdue' | 'today' | 'upcoming' | 'ai_lead';
  icon: React.ReactNode;
  opportunityId?: string;
}

export function PendingTasks() {
  const { data: opportunitiesData } = useOpportunities();
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Derive tasks from opportunities with next_step or ai_generated status
  const derivedTasks: Task[] = [];

  // Add AI-generated leads that need validation
  opportunitiesData?.all
    ?.filter(o => o.validation_status === 'ai_generated')
    ?.slice(0, 2)
    ?.forEach(o => {
      derivedTasks.push({
        id: `ai-${o.id}`,
        title: `Validar lead IA - ${o.customer?.name || o.title}`,
        dueInfo: 'Nova oportunidade',
        type: 'ai_lead',
        icon: <Sparkles className="h-4 w-4" />,
        opportunityId: o.id,
      });
    });

  // Add tasks from opportunities with next_step
  opportunitiesData?.all
    ?.filter(o => o.next_step && o.validation_status !== 'ai_generated')
    ?.slice(0, 3)
    ?.forEach((o, index) => {
      const types: Task['type'][] = ['overdue', 'today', 'upcoming'];
      const dueInfos = ['Atrasado 2h', 'Hoje 16:00', 'Amanhã 09:00'];
      derivedTasks.push({
        id: `task-${o.id}`,
        title: o.next_step!,
        dueInfo: dueInfos[index % 3],
        type: types[index % 3],
        icon: index === 0 ? <Phone className="h-4 w-4" /> : index === 1 ? <FileText className="h-4 w-4" /> : <Users className="h-4 w-4" />,
        opportunityId: o.id,
      });
    });

  // If no real tasks, show placeholder tasks
  const tasks: Task[] = derivedTasks.length > 0 ? derivedTasks : [
    {
      id: 'placeholder-1',
      title: 'Ligar para cliente potencial',
      dueInfo: 'Hoje 16:00',
      type: 'today',
      icon: <Phone className="h-4 w-4" />,
    },
    {
      id: 'placeholder-2',
      title: 'Enviar proposta comercial',
      dueInfo: 'Amanhã 09:00',
      type: 'upcoming',
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: 'placeholder-3',
      title: 'Reunião de follow-up',
      dueInfo: 'Sexta 10:30',
      type: 'upcoming',
      icon: <Users className="h-4 w-4" />,
    },
  ];

  const pendingCount = tasks.filter(t => !completedTasks.has(t.id)).length;

  const handleToggleTask = (taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const getTypeStyles = (type: Task['type']) => {
    switch (type) {
      case 'overdue':
        return 'text-destructive';
      case 'today':
        return 'text-primary';
      case 'ai_lead':
        return 'text-purple-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">Tarefas Pendentes</CardTitle>
          <Badge variant="secondary" className="h-5 text-xs">
            {pendingCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((task) => {
          const isCompleted = completedTasks.has(task.id);
          return (
            <div 
              key={task.id}
              className={cn(
                "flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors",
                isCompleted && "opacity-50"
              )}
            >
              <Checkbox 
                id={task.id}
                checked={isCompleted}
                onCheckedChange={() => handleToggleTask(task.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <label 
                  htmlFor={task.id}
                  className={cn(
                    "text-sm font-medium cursor-pointer",
                    isCompleted && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </label>
                <div className={cn("flex items-center gap-1.5 text-xs", getTypeStyles(task.type))}>
                  {task.type === 'overdue' && <AlertCircle className="h-3 w-3" />}
                  {task.type === 'ai_lead' && <Sparkles className="h-3 w-3" />}
                  {task.dueInfo}
                </div>
              </div>
              <div className="text-muted-foreground">
                {task.icon}
              </div>
            </div>
          );
        })}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Ver todas as tarefas
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
