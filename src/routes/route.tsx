import {createBrowserRouter} from "react-router-dom"
import Login from "../auth/login"
import AdminLayout from "../layout/adminlayout"
import Overview from "../Admin/Overview"
import Users from "../Admin/Users"
import Transactions from "../Admin/Transactions"
import Operations from "../Admin/Operations"
import RFQs from "../Admin/Rfq"
import Escrow from "../Admin/Escrows"
import Register from "../auth/Register"
import Payments from "../Admin/Payments"
import Rate from "../Admin/Rate"
import Promotion from "../Admin/Promotion"
import Settings from "../Admin/Settings"

export const router = createBrowserRouter([
    {
        path: "",
        element:<Login/>

    },
    {
        path: "register",
        element: <Register/>
    },
    {
        path: "admin",
        element:<AdminLayout/>,
        children: [
            {
                path : "overview", 
                element: <Overview/>
            }, 
            {
                path: "users",
                element: <Users/>
            },
            {
                path: "transactions",
                element: <Transactions/>
            },
            {
                path: "operations",
                element: <Operations/>
            },
            {
                path: "rfqs",
                element: <RFQs/>
            }, 
            {
                path: "escrow",
                element: <Escrow/>
            }, 
            {
                path: "payments",
                element: <Payments/>
            },
            {
                path: "rate-cards",
                element: <Rate/>
            },
            {
                path: "promotions",
                element: <Promotion/>
            },
            {
                path: "reconciliation"
            },
            {
                path: "security"
            },
            {
                path : "notifications"
            }, 
            {
                path : "reports"
            }, 
            {
                path: "audit-log"
            }, 
            {
                path : "settings", 
                element: <Settings/>
            }

        ]
    }
])