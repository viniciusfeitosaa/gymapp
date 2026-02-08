import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticatePersonal, authenticateStudent } from '../middlewares/auth.middleware';

const router = Router();
const studentController = new StudentController();

// Rotas do Personal (gerenciar alunos)
router.post('/', authenticatePersonal, studentController.createStudent);
router.get('/', authenticatePersonal, studentController.getStudents);
router.get('/:id', authenticatePersonal, studentController.getStudentById);
router.put('/:id', authenticatePersonal, studentController.updateStudent);
router.delete('/:id', authenticatePersonal, studentController.deleteStudent);
router.post('/:id/generate-code', authenticatePersonal, studentController.generateAccessCode);

// Rotas do Aluno (ver seus próprios dados)
router.get('/me/profile', authenticateStudent, studentController.getMyProfile);

export { router as studentRoutes };
