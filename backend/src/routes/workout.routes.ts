import { Router } from 'express';
import { WorkoutController } from '../controllers/workout.controller';
import { authenticatePersonal, authenticateStudent } from '../middlewares/auth.middleware';

const router = Router();
const workoutController = new WorkoutController();

// Rotas do Personal
router.post('/', authenticatePersonal, workoutController.createWorkout);
router.get('/student/:studentId', authenticatePersonal, workoutController.getStudentWorkouts);
router.put('/:id', authenticatePersonal, workoutController.updateWorkout);
router.delete('/:id', authenticatePersonal, workoutController.deleteWorkout);

// Rotas do Aluno
router.get('/my-workouts', authenticateStudent, workoutController.getMyWorkouts);
router.get('/today', authenticateStudent, workoutController.getTodayWorkout);
router.post('/log/:workoutId', authenticateStudent, workoutController.logWorkout);

export { router as workoutRoutes };
