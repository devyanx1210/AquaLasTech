// reports.routes - /reports/* endpoints for sales and inventory reports
import express from 'express'
import { connectToDatabase } from '../config/db.js'
import { verifyToken } from '../middleware/verifyToken.middleware.js'

const router = express.Router()
router.use(verifyToken)

// GET /reports/summary?period=daily|weekly|monthly|annually
router.get('/summary', async (req, res) => {
    const user = (req as any).user
    const station_id = user.station_id

    console.log('[reports/summary] user:', user)
    console.log('[reports/summary] station_id:', station_id)

    if (!station_id) return res.status(400).json({ message: 'No station assigned' })

    const { period = 'daily' } = req.query

    try {
        const db = await connectToDatabase()

        const groupFormat: Record<string, string> = {
            daily: '%Y-%m-%d',
            weekly: '%x-W%v',
            monthly: '%Y-%m',
            annually: '%Y',
        }
        const fmt = groupFormat[period as string] ?? '%Y-%m-%d'

        // range with alias (for queries using "o" alias)
        const rangeClause: Record<string, string> = {
            daily: `AND DATE(o.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
            weekly: `AND DATE(o.created_at) >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)`,
            monthly: `AND DATE(o.created_at) >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)`,
            annually: `AND DATE(o.created_at) >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)`,
        }
        const range = rangeClause[period as string] ?? rangeClause.daily

        // range without alias (for queries without table alias)
        const rangeClauseNoAlias: Record<string, string> = {
            daily: `AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
            weekly: `AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)`,
            monthly: `AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)`,
            annually: `AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)`,
        }
        const rangeNoAlias = rangeClauseNoAlias[period as string] ?? rangeClauseNoAlias.daily

        // order_status TINYINT: confirmed=1, preparing=2, out_for_delivery=3, delivered=4, cancelled=5, returned=6
        // payment_mode TINYINT: gcash=1, cash=2, cash_on_delivery=3, cash_on_pickup=4
        const [rows]: any = await db.query(`
            SELECT
                DATE_FORMAT(o.created_at, '${fmt}')                                                                        AS period_label,
                SUM(CASE WHEN o.order_status NOT IN (5, 6) THEN 1 ELSE 0 END)                                              AS total_orders,
                SUM(CASE WHEN o.order_status NOT IN (5, 6) THEN o.total_amount ELSE 0 END)                                 AS total_revenue,
                SUM(CASE WHEN o.order_status = 4 THEN 1 ELSE 0 END)                                                        AS delivered,
                SUM(CASE WHEN o.order_status = 5 THEN 1 ELSE 0 END)                                                        AS cancelled,
                SUM(CASE WHEN o.order_status = 6 THEN 1 ELSE 0 END)                                                        AS returned,
                SUM(CASE WHEN o.order_status = 1 THEN 1 ELSE 0 END)                                                        AS confirmed,
                SUM(CASE WHEN o.order_status = 2 THEN 1 ELSE 0 END)                                                        AS preparing,
                SUM(CASE WHEN o.order_status = 3 THEN 1 ELSE 0 END)                                                        AS out_for_delivery,
                SUM(CASE WHEN o.order_status = 4 THEN o.total_amount ELSE 0 END)                                           AS confirmed_revenue,
                SUM(CASE WHEN o.payment_mode = 2 AND o.order_status NOT IN (5, 6) THEN o.total_amount ELSE 0 END)          AS cash_revenue,
                SUM(CASE WHEN o.payment_mode = 1 AND o.order_status NOT IN (5, 6) THEN o.total_amount ELSE 0 END)          AS gcash_revenue
            FROM orders o
            WHERE o.station_id = ?
            ${range}
            GROUP BY period_label
            ORDER BY period_label ASC
        `, [station_id])

        // Overall totals for the period
        const [totals]: any = await db.query(`
            SELECT
                SUM(CASE WHEN order_status NOT IN (5, 6) THEN 1 ELSE 0 END)             AS total_orders,
                SUM(CASE WHEN order_status NOT IN (5, 6) THEN total_amount ELSE 0 END)  AS total_revenue,
                SUM(CASE WHEN order_status = 4 THEN 1    ELSE 0 END)                    AS delivered,
                SUM(CASE WHEN order_status = 5 THEN 1    ELSE 0 END)                    AS cancelled,
                SUM(CASE WHEN order_status = 6 THEN 1    ELSE 0 END)                    AS returned,
                SUM(CASE WHEN order_status = 4 THEN total_amount ELSE 0 END)            AS confirmed_revenue
            FROM orders
            WHERE station_id = ?
            ${rangeNoAlias}
        `, [station_id])

        // Top products by qty sold (delivered orders only — order_status=4)
        const [topProducts]: any = await db.query(`
            SELECT
                p.product_name,
                SUM(oi.quantity)                     AS total_qty,
                SUM(oi.quantity * oi.price_snapshot) AS total_revenue
            FROM order_items oi
            JOIN orders   o ON o.order_id   = oi.order_id
            JOIN products p ON p.product_id = oi.product_id
            WHERE o.station_id = ?
            AND o.order_status = 4
            ${range}
            GROUP BY p.product_id, p.product_name
            ORDER BY total_qty DESC
            LIMIT 5
        `, [station_id])

        return res.json({ period, rows, totals: totals[0], topProducts })
    } catch (err) {
        console.error('GET /reports/summary error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// GET /reports/day/:date — full breakdown for one day
router.get('/day/:date', async (req, res) => {
    const user = (req as any).user
    const station_id = user.station_id
    const { date } = req.params

    try {
        const db = await connectToDatabase()

        const [orders]: any = await db.query(`
            SELECT
                o.order_id, o.order_reference, o.total_amount,
                CASE o.order_status
                    WHEN 1 THEN 'confirmed'
                    WHEN 2 THEN 'preparing'
                    WHEN 3 THEN 'out_for_delivery'
                    WHEN 4 THEN 'delivered'
                    WHEN 5 THEN 'cancelled'
                    WHEN 6 THEN 'returned'
                    ELSE 'confirmed'
                END AS order_status,
                CASE o.payment_mode
                    WHEN 1 THEN 'gcash'
                    WHEN 2 THEN 'cash'
                    WHEN 3 THEN 'cash_on_delivery'
                    WHEN 4 THEN 'cash_on_pickup'
                    ELSE 'cash'
                END AS payment_mode,
                o.created_at,
                u.full_name AS customer_name
            FROM orders o
            LEFT JOIN users u ON u.user_id = o.user_id
            WHERE o.station_id = ? AND DATE(o.created_at) = ?
            ORDER BY o.created_at DESC
        `, [station_id, date])

        const [summary]: any = await db.query(`
            SELECT
                SUM(CASE WHEN order_status NOT IN (5, 6) THEN 1 ELSE 0 END)            AS total_orders,
                SUM(CASE WHEN order_status NOT IN (5, 6) THEN total_amount ELSE 0 END) AS total_revenue,
                SUM(CASE WHEN order_status = 4 THEN 1 ELSE 0 END)                      AS delivered,
                SUM(CASE WHEN order_status = 5 THEN 1 ELSE 0 END)                      AS cancelled,
                SUM(CASE WHEN order_status = 6 THEN 1 ELSE 0 END)                      AS returned,
                SUM(CASE WHEN order_status = 1 THEN 1 ELSE 0 END)                      AS confirmed,
                SUM(CASE WHEN order_status = 2 THEN 1 ELSE 0 END)                      AS preparing,
                SUM(CASE WHEN order_status = 3 THEN 1 ELSE 0 END)                      AS out_for_delivery,
                SUM(CASE WHEN order_status = 4 THEN total_amount ELSE 0 END)           AS earned_revenue
            FROM orders
            WHERE station_id = ? AND DATE(created_at) = ?
        `, [station_id, date])

        return res.json({ date, orders, summary: summary[0] })
    } catch (err) {
        console.error('GET /reports/day error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

export default router