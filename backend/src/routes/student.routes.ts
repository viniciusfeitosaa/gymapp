import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticatePersonal, authenticateStudent } from '../middlewares/auth.middleware';

const router = Router();
const studentController = new StudentController();

// Rotas do Personal (gerenciar alunos)
router.post('/', authenticatePersonal, studentController.createStudent.bind(studentController));
router.get('/', authenticatePersonal, studentController.getStudents.bind(studentController));
router.get('/:id', authenticatePersonal, studentController.getStudentById.bind(studentController));
router.put('/:id', authenticatePersonal, studentController.updateStudent.bind(studentController));
router.delete('/:id', authenticatePersonal, studentController.deleteStudent.bind(studentController));
router.post('/:id/generate-code', authenticatePersonal, studentController.generateAccessCode.bind(studentController));

// Rotas do Aluno (ver seus próprios dados)
router.get('/me/profile', authenticateStudent, studentController.getMyProfile.bind(studentController));

export { router as studentRoutes };
