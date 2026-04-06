import express from 'express';
import {departments, subjects} from "../db/schema";
import {and, desc, eq, getTableColumns, ilike, or, sql} from "drizzle-orm";
import {db} from "../db";

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const {search, department, page = '1', limit = '10'} = req.query;

        const parsePositiveInt = (value: unknown, fallback: number, max?: number) => {
            const raw = Array.isArray(value) ? value[0] : value;
            const parsed = Number.parseInt(String(raw), 10);
            if (!Number.isFinite(parsed) || parsed < 1) return fallback;
            return max ? Math.min(parsed, max) : parsed;
        };

        const parseQueryText = (value: unknown) => {
            const raw = Array.isArray(value) ? value[0] : value;
            return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
        };

        const currentPage = parsePositiveInt(page, 1);
        const limitPerPage = parsePositiveInt(limit, 10, 100);
        const searchText = parseQueryText(search);
        const departmentText = parseQueryText(department);

        const offset = (currentPage - 1) * limitPerPage
        const filterConditions = []

        if (searchText) {
            filterConditions.push(
                or(
                    ilike(subjects.name, `%${searchText}%`),
                    ilike(subjects.code, `%${searchText}%`)
                )
            )
        }

        if (departmentText) {
            filterConditions.push(
                ilike(departments.name, `%${departmentText}%`)
            )
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;
        const countResult = await db.select({count: sql<number>`count(*)`}).from(subjects).leftJoin(departments, eq(subjects.departmentId, departments.id)).where(whereClause)
        const totalCount = Number(countResult[0]?.count ?? 0)

        // @ts-ignore
        const subjectsList = await db.query.subjects.findMany({
            with: {
                departments: true
            },
            where: whereClause,
            orderBy: desc(subjects.createdAt),
            limit: limitPerPage,
            offset: offset
        })

        const data = subjectsList.map(({ departments, ...subject }) => ({
            ...subject,
            department: departments
        }))

        res.status(200).json({
            data,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        })
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

export default router;
