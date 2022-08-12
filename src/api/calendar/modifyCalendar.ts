import express, { Request, Response, NextFunction } from 'express';

import { jwtTokenType } from '../../types';
import { jwtToken } from '../../token';
import { sql } from '../../dbHandle';
import { cryptoHandle } from '../../cryptoHandle';

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: false }));

router.post('/', async (req: Request, res: Response) => {
    const userToken: string | null = req.headers.authorization as string ?? null;

    if (!userToken) {
        return res.json({
            isError: true,
            message: '토큰이 비어있습니다.',
        });
    }

    const { calendarID, title, s_date, e_date, content }: { calendarID: string, title: string, s_date: string, e_date: string, content: string } = Object.assign(req.body, req.query);

    if (!title || !s_date || !e_date || !content) {
        return res.json({
            isError: true,
            message: '입력하지 않은 값들이 있습니다.',
        });
    }

    const { isError, returnValue }: { isError: boolean, returnValue: jwtTokenType } = await jwtToken.verifyToken(userToken);

    if (isError || returnValue.type !== 'A') {
        return res.json({
            isError: true,
            message: '데이터 접근 권한이 없습니다.',
        });
    }

    try {
        await sql(`UPDATE ${process.env.MYSQL_DB}.calendar set title=?, sDate=?, eDate=?, content=? where calendarID=? and userID=?`,
            [title, s_date, e_date, content, calendarID, cryptoHandle.AES_DEC(returnValue.id)]);

        return res.json({
            isError: false,
            message: '성공적으로 일정을 수정했습니다'
        });
    } catch (err) {
        return res.json({
            isError: true,
            message: err
        })
    }
});

export = router;