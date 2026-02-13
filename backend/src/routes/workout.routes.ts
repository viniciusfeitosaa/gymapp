import { Router } from 'express';
import { WorkoutController } from '../controllers/workout.controller';
import { authenticatePersonal, authenticateStudent } from '../middlewares/auth.middleware';

const router = Router();
const workoutController = new WorkoutController();

// Rotas do Personal
router.get('/', authenticatePersonal, workoutController.getAllWorkouts.bind(workoutController));
router.post('/', authenticatePersonal, workoutController.createWorkout.bind(workoutController));
router.get('/student/:studentId', authenticatePersonal, workoutController.getStudentWorkouts.bind(workoutController));
router.put('/:id', authenticatePersonal, workoutController.updateWorkout.bind(workoutController));
router.delete('/:id', authenticatePersonal, workoutController.deleteWorkout.bind(workoutController));

// Rotas do Aluno
router.get('/my-workouts', authenticateStudent, workoutController.getMyWorkouts.bind(workoutController));
router.get('/my-logs', authenticateStudent, workoutController.getMyLogs.bind(workoutController));
router.get('/streak-stats', authenticateStudent, workoutController.getStreakStats.bind(workoutController));
router.get('/today', authenticateStudent, workoutController.getTodayWorkout.bind(workoutController));
router.post('/log/:workoutId', authenticateStudent, workoutController.logWorkout.bind(workoutController));

// Personal: atividades recentes (conclusões de treino dos alunos)
router.get('/recent-logs', authenticatePersonal, workoutController.getRecentLogs.bind(workoutController));

export { router as workoutRoutes };
