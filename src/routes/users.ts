import express from 'express';
import {user} from "../db/schema/index.js";
import {and, desc, eq, ilike, or, sql} from "drizzle-orm";
import {db} from "../db/index.js";

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const {search, role, page = '1', limit = '10'} = req.query;

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
        const roleText = parseQueryText(role);

        const offset = (currentPage - 1) * limitPerPage;
        const filterConditions = [];

        if (searchText) {
            filterConditions.push(
                or(
                    ilike(user.name, `%${searchText}%`),
                    ilike(user.email, `%${searchText}%`)
                )
            );
        }

        if (roleText) {
            // Check if role is valid for the enum if needed, but the issue says exact match
            filterConditions.push(
                eq(user.role, roleText as any)
            );
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db.select({count: sql<number>`count(*)`}).from(user).where(whereClause);
        const totalCount = Number(countResult[0]?.count ?? 0);

        const usersList = await db.query.user.findMany({
            where: whereClause,
            orderBy: desc(user.createdAt),
            limit: limitPerPage,
            offset: offset
        });

        res.status(200).json({
            data: usersList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

export default router;
