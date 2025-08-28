
import { render } from 'preact';
import { useState, useEffect, useMemo } from 'preact/hooks';
import { h } from 'preact';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- MOCK DATA (Users and historical performance charts) ---
const users = [
    { id: 1, name: 'Ana Silva', email: 'ana@totalcad.com', password: 'password123', role: 'Salesperson' },
    { id: 2, name: 'Bruno Costa', email: 'bruno@totalcad.com', password: 'password123', role: 'Salesperson' },
    { id: 3, name: 'Carla Dias', email: 'carla@totalcad.com', password: 'password123', role: 'Salesperson' },
    { id: 4, name: 'Daniel Souza', email: 'daniel@totalcad.com', password: 'password123', role: 'Salesperson' },
    { id: 5, name: 'Eduarda Lima', email: 'eduarda@totalcad.com', password: 'password123', role: 'Salesperson' },
    { id: 6, name: 'Fábio Martins', email: 'fabio@totalcad.com', password: 'password123', role: 'Salesperson' },
    { id: 7, name: 'Gabriela Alves', email: 'gabela@totalcad.com', password: 'password123', role: 'Salesperson' },
    { id: 8, name: 'Gestor TotalCAD', email: 'gestor@totalcad.com', password: 'password123', role: 'Manager' },
];

// This data is now only for the historical charts, not the stat cards.
const salesData = {
    1: { performance: [ { day: 'D-6', sales: 11000, forecast: 10000 }, { day: 'D-5', sales: 9500, forecast: 10000 }, { day: 'D-4', sales: 12500, forecast: 11000 }, { day: 'D-3', sales: 10000, forecast: 12000 }, { day: 'D-2', sales: 13000, forecast: 12000 }, { day: 'D-1', sales: 14000, forecast: 13000 }, { day: 'Hoje', sales: 5000, forecast: 12000 }, ] },
    2: { performance: [ { day: 'D-6', sales: 8000, forecast: 9000 }, { day: 'D-5', sales: 9200, forecast: 9000 }, { day: 'D-4', sales: 7500, forecast: 9000 }, { day: 'D-3', sales: 10500, forecast: 10000 }, { day: 'D-2', sales: 11000, forecast: 10000 }, { day: 'D-1', sales: 6000, forecast: 10000 }, { day: 'Hoje', sales: 9500, forecast: 10000 }, ] },
    3: { performance: [ { day: 'D-6', sales: 15000, forecast: 14000 }, { day: 'D-5', sales: 14500, forecast: 14000 }, { day: 'D-4', sales: 16000, forecast: 15000 }, { day: 'D-3', sales: 13000, forecast: 15000 }, { day: 'D-2', sales: 17000, forecast: 15000 }, { day: 'D-1', sales: 18000, forecast: 16000 }, { day: 'Hoje', sales: 10000, forecast: 16000 }, ] },
    4: { performance: [ { day: 'D-6', sales: 5000, forecast: 7000 }, { day: 'D-5', sales: 6000, forecast: 7000 }, { day: 'D-4', sales: 4500, forecast: 7000 }, { day: 'D-3', sales: 8000, forecast: 8000 }, { day: 'D-2', sales: 7500, forecast: 8000 }, { day: 'D-1', sales: 9000, forecast: 8000 }, { day: 'Hoje', sales: 3000, forecast: 8000 }, ] },
    5: { performance: [ { day: 'D-6', sales: 18000, forecast: 16000 }, { day: 'D-5', sales: 17500, forecast: 16000 }, { day: 'D-4', sales: 19000, forecast: 17000 }, { day: 'D-3', sales: 16000, forecast: 17000 }, { day: 'D-2', sales: 20000, forecast: 18000 }, { day: 'D-1', sales: 21000, forecast: 18000 }, { day: 'Hoje', sales: 12000, forecast: 18000 }, ] },
    6: { performance: [ { day: 'D-6', sales: 10000, forecast: 11000 }, { day: 'D-5', sales: 12000, forecast: 11000 }, { day: 'D-4', sales: 9000, forecast: 11000 }, { day: 'D-3', sales: 13000, forecast: 12000 }, { day: 'D-2', sales: 11500, forecast: 12000 }, { day: 'D-1', sales: 14000, forecast: 13000 }, { day: 'Hoje', sales: 7000, forecast: 13000 }, ] },
    7: { performance: [ { day: 'D-6', sales: 7000, forecast: 8000 }, { day: 'D-5', sales: 8500, forecast: 8000 }, { day: 'D-4', sales: 6000, forecast: 8000 }, { day: 'D-3', sales: 9000, forecast: 9000 }, { day: 'D-2', sales: 8000, forecast: 9000 }, { day: 'D-1', sales: 10000, forecast: 9000 }, { day: 'Hoje', sales: 4000, forecast: 9000 }, ] }
};

const managerData = {
    performanceData: [
        { name: 'Ana', sales: 75000, forecast: 80000 }, { name: 'Bruno', sales: 62000, forecast: 60000 },
        { name: 'Carla', sales: 88000, forecast: 85000 }, { name: 'Daniel', sales: 45000, forecast: 50000 },
        { name: 'Eduarda', sales: 95000, forecast: 90000 }, { name: 'Fábio', sales: 71000, forecast: 75000 },
        { name: 'Gabriela', sales: 58000, forecast: 65000 }
    ]
};

// --- HELPERS for dynamic data ---
const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
};

const getInitialUserData = () => ({
    Trimble: { toRenew: 0, renewed: 0 },
    Chaos: { toRenew: 0, renewed: 0 },
    onboarding: 0,
    crossSelling: 0,
    totalSales: 0
});

const getInitialWeeklyData = () => {
    const userIds = users.filter(u => u.role === 'Salesperson').map(u => u.id);
    const usersData = userIds.reduce((acc, id) => {
        acc[id] = getInitialUserData();
        return acc;
    }, {});

    return {
        startOfWeek: getStartOfWeek(),
        users: usersData
    };
};


// --- ICONS ---
const IconDashboard = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "stroke-width": "1.5", stroke: "currentColor" }, h('path', { "stroke-linecap": "round", "stroke-linejoin": "round", d: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" }));
const IconDaylin = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "stroke-width": "1.5", stroke: "currentColor" }, h('path', { "stroke-linecap": "round", "stroke-linejoin": "round", d: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-7.5 12h15" }));
const IconAwards = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "stroke-width": "1.5", stroke: "currentColor" }, h('path', { "stroke-linecap": "round", "stroke-linejoin": "round", d: "M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-6.75c-.621 0-1.125.504-1.125 1.125V18.75m9 0h-9" }));
const IconRanking = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "stroke-width": "1.5", stroke: "currentColor" }, h('path', { "stroke-linecap": "round", "stroke-linejoin": "round", d: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" }));
const IconSettings = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "stroke-width": "1.5", stroke: "currentColor" }, h('path', { "stroke-linecap": "round", "stroke-linejoin": "round", d: "M10.343 3.94c.09-.542.56-1.007 1.11-.95.542.057.957.542.957 1.11 0 .542-.423 1.007-.957 1.11a1.125 1.125 0 01-1.11-.95zM12 20.25a1.125 1.125 0 01-1.125-1.125v-2.625a1.125 1.125 0 012.25 0v2.625c0 .621-.504 1.125-1.125 1.125zM12 15a1.125 1.125 0 01-1.125-1.125v-2.625a1.125 1.125 0 012.25 0v2.625A1.125 1.125 0 0112 15zM12 9.75a1.125 1.125 0 01-1.125-1.125V6a1.125 1.125 0 012.25 0v2.625A1.125 1.125 0 0112 9.75zM15 12a1.125 1.125 0 01-1.125-1.125V9.75a1.125 1.125 0 012.25 0v1.125c0 .621-.504 1.125-1.125 1.125zM18.364 15.182a1.125 1.125 0 01-1.591 0l-1.838-1.838a1.125 1.125 0 010-1.591l1.838-1.838a1.125 1.125 0 011.591 0l1.838 1.838a1.125 1.125 0 010 1.591l-1.838 1.838zM5.636 15.182a1.125 1.125 0 010-1.591l1.838-1.838a1.125 1.125 0 011.591 0l1.838 1.838a1.125 1.125 0 010 1.591l-1.838 1.838a1.125 1.125 0 01-1.591 0l-1.838-1.838zM9 12a1.125 1.125 0 01-1.125-1.125V9.75a1.125 1.125 0 012.25 0v1.125c0 .621-.504 1.125-1.125 1.125z" }));
const IconSparkles = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "stroke-width": "1.5", stroke: "currentColor" }, h('path', { "stroke-linecap": "round", "stroke-linejoin": "round", d: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM18 15.75l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 18l-1.035.259a3.375 3.375 0 00-2.456 2.456L18 21.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 18l1.035-.259a3.375 3.375 0 002.456-2.456L18 15.75z" }));
const IconLogout = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "stroke-width": "1.5", stroke: "currentColor" }, h('path', { "stroke-linecap": "round", "stroke-linejoin": "round", d: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" }));
const IconRefresh = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "stroke-width": "1.5", stroke: "currentColor" }, h('path', { "stroke-linecap": "round", "stroke-linejoin": "round", d: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.696a8.25 8.25 0 00-11.664 0l-3.181 3.183" }));
const IconPercent = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "stroke-width": "1.5", stroke: "currentColor", class: "w-6 h-6" }, h('path', { "stroke-linecap": "round", "stroke-linejoin": "round", d: "M7 100l10-10M7 90a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm10 10a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" }));
const IconUserMinus = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "stroke-width": "1.5", stroke: "currentColor" }, h('path', { "stroke-linecap": "round", "stroke-linejoin": "round", d: "M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" }));
const IconUserPlus = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "stroke-width": "1.5", stroke: "currentColor" }, h('path', { "stroke-linecap": "round", "stroke-linejoin": "round", d: "M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" }));
const IconDollar = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "stroke-width": "1.5", stroke: "currentColor" }, h('path', { "stroke-linecap": "round", "stroke-linejoin": "round", d: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }));
const IconChartBar = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "stroke-width": "1.5", stroke: "currentColor" }, h('path', { "stroke-linecap": "round", "stroke-linejoin": "round", d: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" }));
const IconTrophy = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "stroke-width": "1.5", stroke: "currentColor" }, h('path', { "stroke-linecap": "round", "stroke-linejoin": "round", d: "M16.5 18.75h-9a3 3 0 00-3 3h15a3 3 0 00-3-3zM12 6.75a3 3 0 013 3v3.75a3 3 0 01-3 3h-3.75a3 3 0 01-3-3V9.75a3 3 0 013-3H12zM12 21v-2.25m0 0a3 3 0 003-3H9a3 3 0 003 3z" }));


// --- COMPONENTS ---

const StatCard = ({ title, value, unit = '', icon, target = undefined, targetLogic = undefined }) => {
    let tag = null;
    if (target !== undefined && targetLogic) {
        let isGood = false;
        if (targetLogic === 'higherIsBetter') {
            isGood = value >= target;
        } else if (targetLogic === 'lowerIsBetter') {
            isGood = value <= target;
        }

        tag = h('span', { class: `stat-tag ${isGood ? 'good' : 'bad'}` }, isGood ? 'Na Meta' : 'Fora da Meta');
    }
    
    return h('div', { class: 'stat-card' },
        h('h3', null, icon && h(icon, null), title),
        h('div', { class: 'value-container' },
            h('div', { class: 'value' }, value, h('span', null, ` ${unit}`)),
            tag
        )
    );
};


const ComparisonBarChart = ({ data, key1, key2, labelKey }) => {
    const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const maxValue = Math.max(...data.map(d => Math.max(d[key1], d[key2])));

    return h('div', { class: 'comparison-bar-chart' },
        data.map(item => {
            const height1 = (item[key1] / maxValue) * 100;
            const height2 = (item[key2] / maxValue) * 100;

            return h('div', { class: 'bar-group' },
                h('div', { class: 'bar-wrapper' },
                    h('div', { class: 'bar bar-forecast', style: { height: `${height1}%` }, title: `Forecast: ${formatCurrency(item[key1])}` }),
                    h('div', { class: 'bar bar-sales', style: { height: `${height2}%` }, title: `Vendas: ${formatCurrency(item[key2])}` })
                ),
                h('div', { class: 'bar-label' }, item[labelKey])
            );
        })
    );
};

const DashboardView = ({ currentUser, weeklyData }) => {
    const [activeDeveloper, setActiveDeveloper] = useState('Trimble');

    if (currentUser.role === 'Manager') {
        // FIX: Cast the result of Object.values to any[] to allow for correct type inference in the `reduce` method,
        // which resolves issues with the accumulator and the final aggregated data being typed as 'unknown'.
        const aggregatedData = (Object.values(weeklyData.users || {}) as any[]).reduce((acc, user) => {
            acc.trimbleToRenew += user.Trimble.toRenew;
            acc.trimbleRenewed += user.Trimble.renewed;
            acc.chaosToRenew += user.Chaos.toRenew;
            acc.chaosRenewed += user.Chaos.renewed;
            acc.onboarding += user.onboarding;
            acc.crossSelling += user.crossSelling;
            return acc;
        }, {
            trimbleToRenew: 0,
            trimbleRenewed: 0,
            chaosToRenew: 0,
            chaosRenewed: 0,
            onboarding: 0,
            crossSelling: 0,
        });

        const devData = activeDeveloper === 'Trimble'
            ? { toRenew: aggregatedData.trimbleToRenew, renewed: aggregatedData.trimbleRenewed }
            : { toRenew: aggregatedData.chaosToRenew, renewed: aggregatedData.chaosRenewed };

        const renewalRate = devData.toRenew > 0 ? (devData.renewed / devData.toRenew) * 100 : 0;
        const churn = 100 - renewalRate;

        return h('div', { class: 'dashboard-view' },
            h('div', { class: 'filter-container' },
                h('div', { class: 'filter-buttons' },
                    h('button', { class: `filter-btn ${activeDeveloper === 'Trimble' ? 'active' : ''}`, onClick: () => setActiveDeveloper('Trimble') }, 'Trimble'),
                    h('button', { class: `filter-btn ${activeDeveloper === 'Chaos' ? 'active' : ''}`, onClick: () => setActiveDeveloper('Chaos') }, 'Chaos')
                )
            ),
            h('div', { class: 'dashboard-grid' },
                h(StatCard, { title: 'Qtd de Licenças a Renovar', value: devData.toRenew, icon: IconRefresh }),
                h(StatCard, { title: 'Taxa de Renovação', value: renewalRate.toFixed(1), unit: '%', icon: IconPercent }),
                h(StatCard, { title: 'Churn', value: churn.toFixed(1), unit: '%', icon: IconUserMinus }),
                h(StatCard, { title: 'Onboarding', value: aggregatedData.onboarding, icon: IconUserPlus }),
                h(StatCard, { title: 'Cross Selling', value: aggregatedData.crossSelling, icon: IconDollar })
            ),
            h('div', { class: 'chart-container' },
                h('h3', null, h(IconChartBar, null), 'Performance da Equipe: Forecast vs. Vendas'),
                h('div', { class: 'chart-legend' },
                    h('div', { class: 'legend-item' }, h('div', { class: 'legend-color-box forecast' }), 'Forecast'),
                    h('div', { class: 'legend-item' }, h('div', { class: 'legend-color-box sales' }), 'Vendas')
                ),
                h(ComparisonBarChart, { data: managerData.performanceData, key1: 'forecast', key2: 'sales', labelKey: 'name' })
            )
        );
    }

    // --- Salesperson View ---
    // FIX: Cast userWeeklyData to the correct type to avoid property access errors on type 'unknown'.
    const userWeeklyData = (weeklyData.users?.[currentUser.id] || getInitialUserData()) as ReturnType<typeof getInitialUserData>;
    const performanceData = salesData[currentUser.id]?.performance || [];

    const devData = (activeDeveloper === 'Trimble' ? userWeeklyData.Trimble : userWeeklyData.Chaos) || { toRenew: 0, renewed: 0 };
    const renewalRate = devData.toRenew > 0 ? (devData.renewed / devData.toRenew) * 100 : 0;
    const churn = 100 - renewalRate;
    
    return h('div', { class: 'dashboard-view' },
        h('div', { class: 'filter-container' },
            h('div', { class: 'filter-buttons' },
                h('button', { class: `filter-btn ${activeDeveloper === 'Trimble' ? 'active' : ''}`, onClick: () => setActiveDeveloper('Trimble') }, 'Trimble'),
                h('button', { class: `filter-btn ${activeDeveloper === 'Chaos' ? 'active' : ''}`, onClick: () => setActiveDeveloper('Chaos') }, 'Chaos')
            )
        ),
        h('div', { class: 'dashboard-grid' },
            h(StatCard, { title: 'Minhas Licenças a Renovar', value: devData.toRenew, icon: IconRefresh }),
            h(StatCard, { title: 'Minha Taxa de Renovação', value: renewalRate.toFixed(1), unit: '%', target: 70, targetLogic: 'higherIsBetter', icon: IconPercent }),
            h(StatCard, { title: 'Meu Churn', value: churn.toFixed(1), unit: '%', target: 30, targetLogic: 'lowerIsBetter', icon: IconUserMinus }),
            h(StatCard, { title: 'Meus Onboardings', value: userWeeklyData.onboarding, icon: IconUserPlus }),
            h(StatCard, { title: 'Meu Cross Selling', value: userWeeklyData.crossSelling, icon: IconDollar })
        ),
        h('div', { class: 'chart-container' },
            h('h3', null, h(IconChartBar, null), 'Minha Performance: Últimos 7 dias'),
            h('div', { class: 'chart-legend' },
                h('div', { class: 'legend-item' }, h('div', { class: 'legend-color-box forecast' }), 'Forecast'),
                h('div', { class: 'legend-item' }, h('div', { class: 'legend-color-box sales' }), 'Vendas')
            ),
            h(ComparisonBarChart, { data: performanceData, key1: 'forecast', key2: 'sales', labelKey: 'day' })
        )
    );
};

const AnalysisModal = ({ isOpen, isLoading, title, content, onClose }) => {
    if (!isOpen) return null;

    return h('div', { class: 'modal-overlay' },
        h('div', { class: 'modal-content' },
            h('div', { class: 'modal-header' },
                h('h3', null, h(IconSparkles, null), title)
            ),
            h('div', { class: 'modal-body' },
                isLoading ?
                    h('div', null,
                        h('div', { class: 'spinner' }),
                        h('p', null, 'Gerando insights para o seu dia...')
                    ) :
                    h('p', null, content)
            ),
            h('div', { class: 'modal-footer' },
                h('button', { class: 'btn', onClick: onClose, disabled: isLoading }, 'OK')
            )
        )
    );
};

const DaylinView = ({ currentUser, onUpdateData }) => {
    const [dayStarted, setDayStarted] = useState(false);
    const [dayEnded, setDayEnded] = useState(false);
    const [startOfDayData, setStartOfDayData] = useState(null);
    const [modalState, setModalState] = useState({
        isOpen: false,
        isLoading: false,
        title: '',
        content: '',
        onClose: () => {}
    });

    const resetDay = () => {
        setDayStarted(false);
        setDayEnded(false);
        setStartOfDayData(null);
    };

    const handleStartDaySubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        
        const forecast = Number(formData.get('forecast'));
        const sentiment = formData.get('sentiment')?.toString() || 'não informado';
        const trimbleRenew = Number(formData.get('trimble_renew'));
        const chaosRenew = Number(formData.get('chaos_renew'));

        setStartOfDayData({ forecast, trimbleRenew, chaosRenew });
        onUpdateData(currentUser.id, 'start', { trimbleRenew, chaosRenew });

        setModalState({
            isOpen: true,
            isLoading: true,
            title: 'Análise de Início de Dia',
            content: '',
            onClose: () => {
                setModalState({ ...modalState, isOpen: false });
                setDayStarted(true);
            }
        });

        try {
            const prompt = `You are an encouraging sales coach. Generate a motivational and strategic analysis for a salesperson in Brazil starting their day. The response must be a single paragraph in Brazilian Portuguese.

Here is the salesperson's input for the day:
- Today's sentiment: "${sentiment}"
- Trimble licenses to renew today: ${trimbleRenew}
- Chaos licenses to renew today: ${chaosRenew}
- Sales forecast for today: R$ ${forecast}

The daily sales forecast target is R$ 15,000.

Analyze their forecast against the target.

If the forecast is below the target, provide encouraging but firm advice. Suggest they review their ongoing negotiations, prioritize deals with a higher chance of closing today, and actively look for opportunities to upgrade customer licenses to increase the deal value.

If the forecast is at or above the target, congratulate them on the strong start. Provide strategic tips to exceed the goal, such as focusing on converting the specific Trimble and Chaos renewals, and exploring cross-selling opportunities with existing customers (e.g., V-Ray users).

Always maintain a positive and action-oriented tone.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            setModalState(prev => ({ ...prev, isLoading: false, content: response.text }));

// FIX: Corrected catch block syntax from `catch (error) =>` to `catch (error)`. This was causing a major parsing error.
        } catch (error) {
            console.error("Error generating analysis:", error);
            setModalState(prev => ({ ...prev, isLoading: false, content: "Não foi possível gerar a análise. Tente novamente." }));
        }
    };

    const handleEndDaySubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);

        const trimbleRenewed = Number(formData.get('trimble_renewed'));
        const chaosRenewed = Number(formData.get('chaos_renewed'));
        const onboarding = Number(formData.get('onboarding_count'));
        const crossSelling = Number(formData.get('cross_selling_count'));
        const salesTotal = Number(formData.get('sales_total'));
        const difficulties = formData.get('difficulties').toString() || "Nenhuma dificuldade reportada.";
        
        onUpdateData(currentUser.id, 'end', { trimbleRenewed, chaosRenewed, onboarding, crossSelling, salesTotal });
        
        setModalState({
            isOpen: true,
            isLoading: true,
            title: 'Análise de Fim de Dia',
            content: '',
            onClose: () => {
                setModalState({ ...modalState, isOpen: false });
                setDayEnded(true);
            }
        });

        try {
            const prompt = `You are a supportive sales coach providing end-of-day feedback in Brazilian Portuguese. The response must be a single, concise paragraph.

Here is the salesperson's performance for the day:

**Initial Plan:**
- Sales Forecast: R$ ${startOfDayData.forecast}
- Trimble to Renew: ${startOfDayData.trimbleRenew}
- Chaos to Renew: ${startOfDayData.chaosRenew}

**Actual Results:**
- Total Sales: R$ ${salesTotal}
- Trimble Renewed: ${trimbleRenewed}
- Chaos Renewed: ${chaosRenewed}
- Onboardings: ${onboarding}
- Cross-Sells: ${crossSelling}
- Reported Difficulties: "${difficulties}"

Compare the actual sales with the forecast.
- If they met or exceeded the forecast, congratulate them enthusiastically. Acknowledge their hard work, especially if they overcame the reported difficulties.
- If they didn't meet the forecast, offer encouragement. Acknowledge the effort and the difficulties they faced. Suggest they reflect on what could be improved tomorrow, but end on a positive note about the next day being a new opportunity.

Briefly comment on the renewal numbers and any positive outcomes like onboarding or cross-selling, framing them as successes. Keep the tone motivational and constructive.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setModalState(prev => ({ ...prev, isLoading: false, content: response.text }));

// FIX: Corrected catch block syntax from `catch (error) =>` to `catch (error)`. This was causing a major parsing error.
        } catch (error) {
            console.error("Error generating end-of-day analysis:", error);
            setModalState(prev => ({ ...prev, isLoading: false, content: "Não foi possível gerar a análise de fim de dia. Seu registro foi salvo. Bom descanso!" }));
        }
    };

    const StartDayForm = () => h('form', { onSubmit: handleStartDaySubmit },
        h('div', { class: 'daylin-card-header' },
            h('h3', null, h(IconDaylin, null), 'Iniciar Dia'),
            h('p', null, 'Preencha os campos para iniciar seu dia de vendas.')
        ),
        h('div', { class: 'form-group' },
            h('label', { for: 'sentiment' }, 'Sentimento do dia'),
            h('input', { id: 'sentiment', name: 'sentiment', type: 'text', placeholder: 'Ex: Motivado, Confiante...', required: true })
        ),
        h('div', { class: 'form-row' },
            h('div', { class: 'form-group' },
                h('label', { for: 'trimble_renew' }, 'Qtd Trimble a Renovar'),
                h('input', { id: 'trimble_renew', name: 'trimble_renew', type: 'number', required: true, min: '0' })
            ),
            h('div', { class: 'form-group' },
                h('label', { for: 'chaos_renew' }, 'Qtd Chaos a Renovar'),
                h('input', { id: 'chaos_renew', name: 'chaos_renew', type: 'number', required: true, min: '0' })
            )
        ),
        h('div', { class: 'form-group' },
            h('label', { for: 'forecast' }, 'Forecast do dia (R$)'),
            h('input', { id: 'forecast', name: 'forecast', type: 'number', step: '0.01', placeholder: 'Ex: 15000.00', required: true, min: '0' })
        ),
        h('div', { class: 'form-actions' },
            h('button', { name: 'start', class: 'btn', type: 'submit' }, 'Iniciar Dia')
        )
    );

    const EndDayForm = () => h('form', { onSubmit: handleEndDaySubmit },
        h('div', { class: 'daylin-card-header' },
            h('h3', null, h(IconDaylin, null), 'Encerrar Dia'),
            h('p', null, 'Registre os resultados do seu dia de trabalho.')
        ),
        h('div', { class: 'form-group' },
            h('label', { for: 'difficulties' }, 'Dificuldades do dia de hoje'),
            h('textarea', { id: 'difficulties', name: 'difficulties', required: true })
        ),
        h('div', { class: 'form-row' },
            h('div', { class: 'form-group' },
                h('label', { for: 'trimble_renewed' }, 'Qtd Trimble Renovado'),
                h('input', { id: 'trimble_renewed', name: 'trimble_renewed', type: 'number', required: true, min: '0' })
            ),
             h('div', { class: 'form-group' },
                h('label', { for: 'chaos_renewed' }, 'Qtd Chaos Renovado'),
                h('input', { id: 'chaos_renewed', name: 'chaos_renewed', type: 'number', required: true, min: '0' })
            )
        ),
        h('div', { class: 'form-group' },
            h('label', { for: 'onboarding_count' }, 'Onboarding (Qtd)'),
            h('input', { id: 'onboarding_count', name: 'onboarding_count', type: 'number', required: true, min: '0', placeholder: '0' })
        ),
        h('div', { class: 'form-group' },
            h('label', { for: 'onboarding_details' }, 'Onboarding (Detalhar)'),
            h('textarea', { id: 'onboarding_details', name: 'onboarding_details', placeholder: 'Ex: Cliente X, Licença Y...' })
        ),
        h('div', { class: 'form-group' },
            h('label', { for: 'cross_selling_count' }, 'Cross Selling (Qtd)'),
            h('input', { id: 'cross_selling_count', name: 'cross_selling_count', type: 'number', required: true, min: '0', placeholder: '0' })
        ),
        h('div', { class: 'form-group' },
            h('label', { for: 'cross_selling_details' }, 'Cross Selling (Detalhar)'),
            h('textarea', { id: 'cross_selling_details', name: 'cross_selling_details', placeholder: 'Ex: Venda adicional para Cliente A...' })
        ),
        h('div', { class: 'form-group' },
            h('label', { for: 'sales_total' }, 'Vendas Hoje (R$)'),
            h('input', { id: 'sales_total', name: 'sales_total', type: 'number', step: '0.01', required: true, min: '0' })
        ),
        h('div', { class: 'form-actions' },
            h('button', { name: 'end', class: 'btn', type: 'submit' }, 'Encerrar Dia')
        )
    );

    const DayEndedMessage = ({ onReset }) => h('div', { class: 'day-ended-message' },
        h('h3', null, h(IconDaylin, null), 'Dia Finalizado'),
        h('p', null, 'Seu registro de hoje foi enviado com sucesso. Bom descanso!'),
        h('button', { class: 'btn btn-reset-day', onClick: onReset }, 'Iniciar Novo Dia')
    );

    const renderContent = () => {
        if (dayEnded) {
            return h(DayEndedMessage, { onReset: resetDay });
        }
        if (dayStarted) {
            return h(EndDayForm, null);
        }
        return h(StartDayForm, null);
    };

    return h('div', { class: 'daylin-container' },
        h(AnalysisModal, { ...modalState }),
        h('div', { class: 'daylin-form-card' },
            renderContent()
        )
    );
};

const awardMetrics = {
    totalSales: { label: 'Valor Total Vendido', unit: 'R$' },
    renewalRate: { label: 'Taxa de Renovação', unit: '%' },
    onboardingCount: { label: 'Qtd de Onboardings', unit: '' },
    crossSellingCount: { label: 'Qtd de Cross Selling', unit: '' },
};

const calculateProgress = (user, award, weeklyData) => {
    const userData = weeklyData.users[user.id] || getInitialUserData();
    let currentValue = 0;

    switch (award.metric) {
        case 'totalSales':
            currentValue = userData.totalSales || 0;
            break;
        case 'onboardingCount':
            currentValue = userData.onboarding || 0;
            break;
        case 'crossSellingCount':
            currentValue = userData.crossSelling || 0;
            break;
        case 'renewalRate': {
            const toRenew = (userData.Trimble.toRenew || 0) + (userData.Chaos.toRenew || 0);
            const renewed = (userData.Trimble.renewed || 0) + (userData.Chaos.renewed || 0);
            currentValue = toRenew > 0 ? (renewed / toRenew) * 100 : 0;
            break;
        }
        default:
            currentValue = 0;
    }

    const percentage = award.target > 0 ? (currentValue / award.target) * 100 : 0;
    
    return { currentValue, percentage: Math.min(percentage, 100) };
};


const CreateAwardModal = ({ isOpen, onClose, onCreate, allSalespeople }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [metric, setMetric] = useState('totalSales');
    const [target, setTarget] = useState('');
    const [reward, setReward] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [assignedTo, setAssignedTo] = useState([]);

    const handleUserSelect = (e) => {
        const userId = parseInt(e.target.value, 10);
        if (e.target.checked) {
            setAssignedTo([...assignedTo, userId]);
        } else {
            setAssignedTo(assignedTo.filter(id => id !== userId));
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setAssignedTo(allSalespeople.map(u => u.id));
        } else {
            setAssignedTo([]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !description || !target || !reward || !expiryDate || assignedTo.length === 0) {
            alert('Por favor, preencha todos os campos e selecione ao menos um vendedor.');
            return;
        }
        onCreate({
            title,
            description,
            metric,
            target: parseFloat(target),
            reward,
            expiryDate,
            assignedTo
        });
        onClose();
    };

    if (!isOpen) return null;

    return h('div', { class: 'modal-overlay' },
        h('div', { class: 'modal-content award-modal' },
            h('div', { class: 'modal-header' }, h('h3', null, h(IconAwards, null), 'Criar Novo Prêmio')),
            h('form', { onSubmit: handleSubmit },
                h('div', { class: 'modal-body' },
                    h('div', { class: 'modal-form-grid' },
                        h('div', { class: 'form-group' },
                            h('label', { for: 'award-title' }, 'Título do Prêmio'),
                            h('input', { id: 'award-title', type: 'text', value: title, onInput: e => setTitle((e.target as HTMLInputElement).value) })
                        ),
                        h('div', { class: 'form-group' },
                            h('label', { for: 'award-metric' }, 'Métrica'),
                            h('select', { id: 'award-metric', value: metric, onChange: e => setMetric((e.target as HTMLSelectElement).value) },
                                Object.entries(awardMetrics).map(([key, { label }]) => h('option', { value: key }, label))
                            )
                        ),
                        h('div', { class: 'form-group' },
                            h('label', { for: 'award-target' }, 'Meta'),
                            h('input', { id: 'award-target', type: 'number', value: target, onInput: e => setTarget((e.target as HTMLInputElement).value), placeholder: `Valor da meta (${awardMetrics[metric].unit})` })
                        ),
                        h('div', { class: 'form-group' },
                            h('label', { for: 'award-reward' }, 'Recompensa'),
                            h('input', { id: 'award-reward', type: 'text', value: reward, onInput: e => setReward((e.target as HTMLInputElement).value), placeholder: 'Ex: R$ 500' })
                        ),
                        h('div', { class: 'form-group full-width' },
                            h('label', { for: 'award-description' }, 'Descrição'),
                            h('textarea', { id: 'award-description', value: description, onInput: e => setDescription((e.target as HTMLTextAreaElement).value) })
                        ),
                         h('div', { class: 'form-group' },
                            h('label', { for: 'award-expiry' }, 'Prazo Final'),
                            h('input', { id: 'award-expiry', type: 'date', value: expiryDate, onInput: e => setExpiryDate((e.target as HTMLInputElement).value) })
                        ),
                    ),
                    h('div', { class: 'form-group' },
                        h('label', null, 'Atribuir para:'),
                        h('div', { class: 'user-select-list' },
                            h('div', { class: 'user-select-item' },
                                h('input', { type: 'checkbox', id: 'select-all', onChange: handleSelectAll, checked: assignedTo.length === allSalespeople.length }),
                                h('label', { for: 'select-all' }, 'Todos os Vendedores')
                            ),
                            allSalespeople.map(user => h('div', { class: 'user-select-item' },
                                h('input', { type: 'checkbox', id: `user-${user.id}`, value: user.id, checked: assignedTo.includes(user.id), onChange: handleUserSelect }),
                                h('label', { for: `user-${user.id}` }, user.name)
                            ))
                        )
                    )
                ),
                h('div', { class: 'modal-footer' },
                    h('button', { type: 'button', class: 'btn btn-secondary', onClick: onClose }, 'Cancelar'),
                    h('button', { type: 'submit', class: 'btn' }, 'Criar Prêmio')
                )
            )
        )
    );
};

const AwardCard = ({ award, currentUser, weeklyData, allUsers }) => {
    const isManager = currentUser.role === 'Manager';
    const [managerProgressVisible, setManagerProgressVisible] = useState(false);

    const { currentValue, percentage } = calculateProgress(currentUser, award, weeklyData);
    const metricInfo = awardMetrics[award.metric];

    const formatValue = (value) => {
        if (award.metric === 'totalSales') {
            return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        if (award.metric === 'renewalRate') {
            return `${value.toFixed(1)}%`;
        }
        return value;
    };

    return h('div', { class: 'award-card' },
        h('div', { class: 'award-header' },
            h('h4', null, award.title),
            h('span', { class: 'award-reward' }, award.reward)
        ),
        h('p', { class: 'award-description' }, award.description),
        h('div', { class: 'award-deadline' }, `Válido até: ${new Date(award.expiryDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`),
        
        !isManager && h('div', { class: 'award-progress' },
            h('div', { class: 'progress-bar-container' },
                h('div', { class: 'progress-bar-fill', style: { width: `${percentage}%` } })
            ),
            h('div', { class: 'award-progress-text' },
                `${formatValue(currentValue)} / ${formatValue(award.target)} (${percentage.toFixed(0)}%)`
            )
        ),

        isManager && h('div', { class: 'manager-progress-view' },
            h('button', { class: 'btn btn-secondary btn-sm', onClick: () => setManagerProgressVisible(!managerProgressVisible) }, 
                managerProgressVisible ? 'Ocultar Progresso' : 'Ver Progresso da Equipe'
            ),
            managerProgressVisible && h('ul', { class: 'manager-progress-list' },
                award.assignedTo.map(userId => {
                    const user = allUsers.find(u => u.id === userId);
                    if (!user) return null;
                    const { currentValue: userCurrent, percentage: userPercentage } = calculateProgress(user, award, weeklyData);
                    return h('li', null, 
                        h('span', null, `${user.name}: ${formatValue(userCurrent)} / ${formatValue(award.target)}`),
                        h('div', { class: 'manager-progress-bar-container' }, 
                            h('div', { class: 'progress-bar-fill', style: { width: `${userPercentage}%` } })
                        )
                    );
                })
            )
        )
    );
};

const AwardsView = ({ currentUser, awards, weeklyData, allUsers, onCreateAward }) => {
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const isManager = currentUser.role === 'Manager';

    const salespersonUsers = allUsers.filter(u => u.role === 'Salesperson');

    const myAwards = awards.filter(award => award.assignedTo.includes(currentUser.id));

    const sortedAwards = (isManager ? awards : myAwards).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    return h('div', { class: 'awards-view' },
        isManager && h(CreateAwardModal, { 
            isOpen: isCreateModalOpen,
            onClose: () => setCreateModalOpen(false),
            onCreate: onCreateAward,
            allSalespeople: salespersonUsers
        }),
        h('div', { class: 'view-header' },
            h('h2', null, 'Programa de Prêmios'),
            isManager && h('button', { class: 'btn', onClick: () => setCreateModalOpen(true) }, h(IconAwards, null), 'Criar Novo Prêmio')
        ),
        sortedAwards.length > 0 ?
            h('div', { class: 'awards-grid' },
                sortedAwards.map(award => 
                    h(AwardCard, { key: award.id, award, currentUser, weeklyData, allUsers })
                )
            ) :
            h('div', { class: 'placeholder' }, isManager ? 'Nenhum prêmio foi criado ainda.' : 'Você não tem prêmios atribuídos no momento.')
    );
};

const RankCard = ({ title, rank, total, icon }) => {
    return h('div', { class: 'rank-card' },
        h('h3', null, icon && h(icon, null), title),
        h('div', { class: 'rank-value' },
            h('span', null, '#'),
            rank
        ),
        h('div', { class: 'rank-total' }, `de ${total}`)
    );
};

const RankingView = ({ currentUser, weeklyData, allUsers }) => {
    const [period, setPeriod] = useState('weekly'); // 'weekly' or 'monthly'
    const [sortBy, setSortBy] = useState('sales'); // 'sales' or 'renewal'
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const salespersonUsers = allUsers.filter(u => u.role === 'Salesperson');

    const rankings = useMemo(() => {
        const stats = salespersonUsers.map(user => {
            const data = weeklyData.users[user.id] || getInitialUserData();
            const trimbleRate = data.Trimble.toRenew > 0 ? (data.Trimble.renewed / data.Trimble.toRenew) * 100 : 0;
            const chaosRate = data.Chaos.toRenew > 0 ? (data.Chaos.renewed / data.Chaos.toRenew) * 100 : 0;
            const totalToRenew = data.Trimble.toRenew + data.Chaos.toRenew;
            const totalRenewed = data.Trimble.renewed + data.Chaos.renewed;
            const overallRate = totalToRenew > 0 ? (totalRenewed / totalToRenew) * 100 : 0;

            return {
                id: user.id,
                name: user.name,
                totalSales: data.totalSales || 0,
                trimbleRenewalRate: trimbleRate,
                chaosRenewalRate: chaosRate,
                overallRenewalRate: overallRate,
                onboarding: data.onboarding || 0,
                crossSelling: data.crossSelling || 0,
            };
        });

        const salesRanking = [...stats].sort((a, b) => b.totalSales - a.totalSales);
        const trimbleRanking = [...stats].sort((a, b) => b.trimbleRenewalRate - a.trimbleRenewalRate);
        const chaosRanking = [...stats].sort((a, b) => b.chaosRenewalRate - a.chaosRenewalRate);
        const overallRenewalRanking = [...stats].sort((a, b) => b.overallRenewalRate - a.overallRenewalRate);

        return { stats, salesRanking, trimbleRanking, chaosRanking, overallRenewalRanking };
    }, [weeklyData, allUsers]);


    const handleGenerateAnalysis = async () => {
        setIsLoading(true);
        setAnalysis('');
        const myStats = rankings.stats.find(s => s.id === currentUser.id);
        if (!myStats) {
            setIsLoading(false);
            setAnalysis('Não foi possível encontrar seus dados para análise.');
            return;
        }

        try {
            const prompt = `Você é um coach de vendas amigável e perspicaz. Analise os dados de performance semanal de um vendedor e forneça um insight e uma dica acionável para melhoria. A resposta deve ser um único parágrafo conciso em Português do Brasil.

Dados do Vendedor:
- Vendas Totais na Semana: R$ ${myStats.totalSales.toFixed(2)}
- Taxa de Renovação Trimble: ${myStats.trimbleRenewalRate.toFixed(1)}%
- Taxa de Renovação Chaos: ${myStats.chaosRenewalRate.toFixed(1)}%
- Onboardings Realizados: ${myStats.onboarding}
- Cross-Sellings Realizados: ${myStats.crossSelling}

Analise estes números. Identifique um ponto forte principal e uma área clara para melhoria. Forneça uma dica concreta e prática para a área de melhoria. Mantenha o tom motivacional, direto e útil.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setAnalysis(response.text);
// FIX: Corrected catch block syntax from `catch (error) =>` to `catch (error)`. This was causing a major parsing error.
        } catch (error) {
            console.error("Error generating ranking analysis:", error);
            setAnalysis("Ocorreu um erro ao gerar sua análise. Por favor, tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };


    if (currentUser.role === 'Manager') {
        const sortedUsers = sortBy === 'sales' ? rankings.salesRanking : rankings.overallRenewalRanking;
        return h('div', { class: 'ranking-view' },
            h('div', { class: 'view-header' },
                h('h2', null, 'Ranking da Equipe'),
                h('div', { class: 'filter-buttons' },
                    h('button', { class: `filter-btn ${period === 'weekly' ? 'active' : ''}`, onClick: () => setPeriod('weekly') }, 'Semanal'),
                    h('button', { class: `filter-btn ${period === 'monthly' ? 'active' : ''}`, onClick: () => setPeriod('monthly'), disabled: true }, 'Mensal')
                )
            ),
            h('div', { class: 'filter-container' },
                 h('div', { class: 'filter-buttons' },
                    h('button', { class: `filter-btn ${sortBy === 'sales' ? 'active' : ''}`, onClick: () => setSortBy('sales') }, 'Ordenar por Vendas'),
                    h('button', { class: `filter-btn ${sortBy === 'renewal' ? 'active' : ''}`, onClick: () => setSortBy('renewal') }, 'Ordenar por Renovação')
                )
            ),
            h('div', { class: 'ranking-table-container' },
                h('table', { class: 'ranking-table' },
                    h('thead', null, h('tr', null,
                        h('th', null, 'Posição'),
                        h('th', null, 'Vendedor'),
                        h('th', null, 'Vendas (Semana)'),
                        h('th', null, 'Tx. Renovação (Geral)')
                    )),
                    h('tbody', null, sortedUsers.map((user, index) =>
                        h('tr', { key: user.id },
                            h('td', null, h('span', { class: 'rank-position' }, index + 1)),
                            h('td', null, user.name),
                            h('td', null, user.totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })),
                            h('td', null, `${user.overallRenewalRate.toFixed(1)}%`)
                        )
                    ))
                )
            )
        );
    }

    // --- Salesperson View ---
    const mySalesRank = rankings.salesRanking.findIndex(u => u.id === currentUser.id) + 1;
    const myTrimbleRank = rankings.trimbleRanking.findIndex(u => u.id === currentUser.id) + 1;
    const myChaosRank = rankings.chaosRanking.findIndex(u => u.id === currentUser.id) + 1;
    const totalSalespeople = salespersonUsers.length;

    return h('div', { class: 'ranking-view' },
        h('div', { class: 'view-header' },
            h('h2', null, 'Meu Ranking'),
             h('div', { class: 'filter-buttons' },
                h('button', { class: `filter-btn ${period === 'weekly' ? 'active' : ''}`, onClick: () => setPeriod('weekly') }, 'Semanal'),
                h('button', { class: `filter-btn ${period === 'monthly' ? 'active' : ''}`, onClick: () => setPeriod('monthly'), disabled: true }, 'Mensal')
            )
        ),
        h('div', { class: 'dashboard-grid' },
            h(RankCard, { title: 'Sua Posição em Vendas', rank: mySalesRank, total: totalSalespeople, icon: IconDollar }),
            h(RankCard, { title: 'Sua Posição em Renovação Trimble', rank: myTrimbleRank, total: totalSalespeople, icon: IconPercent }),
            h(RankCard, { title: 'Sua Posição em Renovação Chaos', rank: myChaosRank, total: totalSalespeople, icon: IconPercent })
        ),
        h('div', { class: 'analysis-container' },
            h('h3', null, h(IconSparkles, null), 'Análise de Performance'),
            h('p', null, 'Receba um insight e dicas com base nos seus resultados para melhorar sua performance.'),
            !analysis && !isLoading && h('button', { class: 'btn', onClick: handleGenerateAnalysis }, 'Gerar Análise'),
            isLoading && h('div', { class: 'spinner' }),
            analysis && h('div', { class: 'analysis-result' }, analysis)
        )
    );
};

const SettingsView = ({ currentUser, onUpdatePassword, theme, onSetTheme }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'As novas senhas não coincidem.' });
            return;
        }
        if (newPassword.length < 6) {
             setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
            return;
        }
        
        // Mock password check
        if (currentPassword !== currentUser.password) {
            setMessage({ type: 'error', text: 'A senha atual está incorreta.' });
            return;
        }

        onUpdatePassword(newPassword);
        setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    return h('div', { class: 'settings-view' },
        h('div', { class: 'settings-card' },
            h('h3', null, 'Alterar Senha'),
            h('form', { onSubmit: handlePasswordSubmit },
                message.text && h('p', { class: `message ${message.type}` }, message.text),
                h('div', { class: 'form-group' },
                    h('label', { for: 'current-password' }, 'Senha Atual'),
                    h('input', { id: 'current-password', type: 'password', value: currentPassword, onInput: e => setCurrentPassword((e.target as HTMLInputElement).value), required: true })
                ),
                h('div', { class: 'form-group' },
                    h('label', { for: 'new-password' }, 'Nova Senha'),
                    h('input', { id: 'new-password', type: 'password', value: newPassword, onInput: e => setNewPassword((e.target as HTMLInputElement).value), required: true })
                ),
                h('div', { class: 'form-group' },
                    h('label', { for: 'confirm-password' }, 'Confirmar Nova Senha'),
                    h('input', { id: 'confirm-password', type: 'password', value: confirmPassword, onInput: e => setConfirmPassword((e.target as HTMLInputElement).value), required: true })
                ),
                h('button', { class: 'btn', type: 'submit' }, 'Salvar Alterações')
            )
        ),
        h('div', { class: 'settings-card' },
            h('h3', null, 'Aparência'),
            h('div', { class: 'theme-selector' },
                h('label', null, 'Tema'),
                h('div', { class: 'theme-toggle' },
                    h('span', null, 'Claro'),
                    h('label', { class: 'switch' },
                        h('input', { type: 'checkbox', checked: theme === 'dark', onChange: () => onSetTheme(theme === 'light' ? 'dark' : 'light') }),
                        h('span', { class: 'slider round' })
                    ),
                    h('span', null, 'Escuro')
                )
            )
        )
    );
};


const DashboardPanel = ({ currentUser, onLogout, weeklyData, onUpdateData, awards, onCreateAward, allUsers, theme, onSetTheme, onUpdatePassword }) => {
    const [activeTab, setActiveTab] = useState('Dashboard');

    const tabs = [
        { name: 'Dashboard', icon: IconDashboard },
        { name: 'Daylin', icon: IconDaylin },
        { name: 'Prêmios', icon: IconAwards },
        { name: 'Ranking', icon: IconRanking },
        { name: 'Configurações', icon: IconSettings },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'Dashboard': return h(DashboardView, { currentUser, weeklyData });
            case 'Daylin': return h(DaylinView, { currentUser, onUpdateData });
            case 'Prêmios': return h(AwardsView, { currentUser, awards, weeklyData, allUsers, onCreateAward });
            case 'Ranking': return h(RankingView, { currentUser, weeklyData, allUsers });
            case 'Configurações': return h(SettingsView, { currentUser, onUpdatePassword, theme, onSetTheme });
            default: return h(DashboardView, { currentUser, weeklyData });
        }
    };

    return h('div', { class: 'app-container' },
        h('aside', { class: 'sidebar' },
            h('div', null, 
                h('div', { class: 'sidebar-header' },
                    h('h1', null, 'SaaS ', h('span', null, 'Farmers')),
                    h('p', null, 'by TotalCAD Softwares')
                ),
                h('ul', { class: 'nav-list' },
                    tabs.map(tab => h('li', { class: 'nav-item' },
                        h('button', {
                            class: activeTab === tab.name ? 'active' : '',
                            onClick: () => setActiveTab(tab.name)
                        }, h(tab.icon, null), tab.name)
                    ))
                )
            ),
            h('div', { class: 'sidebar-footer' },
                h('button', { class: 'logout-btn', onClick: onLogout }, h(IconLogout, null), 'Sair')
            )
        ),
        h('header', { class: 'header' },
            h('h2', null, activeTab),
            h('div', { class: 'user-info' }, `Olá, ${currentUser.name.split(' ')[0]}`)
        ),
        h('main', { class: 'main-content' },
            renderContent()
        )
    );
};

const LoginView = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            onLogin(user);
        } else {
            setError('Credenciais inválidas. Tente novamente.');
        }
    };

    return h('div', { class: 'auth-container' },
        h('div', { class: 'auth-card' },
            h('div', { class: 'sidebar-header' },
                h('h1', null, 'SaaS ', h('span', null, 'Farmers')),
                h('p', null, 'by TotalCAD Softwares')
            ),
            h('h3', null, 'Acesse o Painel'),
            h('form', { onSubmit: handleSubmit },
                error && h('p', { class: 'error-message' }, error),
                h('div', { class: 'form-group' },
                    h('label', { for: 'email' }, 'Email'),
                    h('input', {
                        id: 'email',
                        type: 'email',
                        value: email,
                        onInput: (e) => setEmail((e.target as HTMLInputElement).value),
                        required: true
                    })
                ),
                h('div', { class: 'form-group' },
                    h('label', { for: 'password' }, 'Senha'),
                    h('input', {
                        id: 'password',
                        type: 'password',
                        value: password,
                        onInput: (e) => setPassword((e.target as HTMLInputElement).value),
                        required: true
                    })
                ),
                h('button', { class: 'btn', type: 'submit' }, 'Entrar')
            )
        )
    );
}


const App = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [weeklyData, setWeeklyData] = useState(getInitialWeeklyData());
    const [awards, setAwards] = useState([]);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        // Apply theme
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        // Auth check
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }

        // Weekly data check
        const storedWeeklyData = localStorage.getItem('weeklyData');
        const currentStartOfWeek = getStartOfWeek();

        if (storedWeeklyData) {
            const parsedData = JSON.parse(storedWeeklyData);
            if (parsedData.startOfWeek === currentStartOfWeek) {
                setWeeklyData(parsedData);
            } else {
                // New week, reset data
                const initialData = getInitialWeeklyData();
                setWeeklyData(initialData);
                localStorage.setItem('weeklyData', JSON.stringify(initialData));
            }
        } else {
            // No data, initialize
            const initialData = getInitialWeeklyData();
            setWeeklyData(initialData);
            localStorage.setItem('weeklyData', JSON.stringify(initialData));
        }
        
        // Load awards
        const storedAwards = localStorage.getItem('awards');
        if (storedAwards) {
            setAwards(JSON.parse(storedAwards));
        }
    }, []);

    const handleLogin = (user) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
    };

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
    };

    const handleDaylinUpdate = (userId, type, data) => {
        setWeeklyData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            const user = newData.users[userId] || getInitialUserData();

            if (type === 'start') {
                user.Trimble.toRenew += data.trimbleRenew || 0;
                user.Chaos.toRenew += data.chaosRenew || 0;
            } else if (type === 'end') {
                user.Trimble.renewed += data.trimbleRenewed || 0;
                user.Chaos.renewed += data.chaosRenewed || 0;
                user.onboarding += data.onboarding || 0;
                user.crossSelling += data.crossSelling || 0;
                user.totalSales += data.salesTotal || 0;
            }

            newData.users[userId] = user;
            localStorage.setItem('weeklyData', JSON.stringify(newData));
            return newData;
        });
    };
    
    const handleCreateAward = (newAward) => {
        setAwards(prevAwards => {
            const updatedAwards = [...prevAwards, { ...newAward, id: Date.now() }];
            localStorage.setItem('awards', JSON.stringify(updatedAwards));
            return updatedAwards;
        });
    };

    const handleUpdatePassword = (newPassword) => {
        // In a real app, this would be an API call. Here, we'll just update the mock data and localStorage.
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].password = newPassword;
            const updatedUser = { ...currentUser, password: newPassword };
            setCurrentUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
    };


    if (!currentUser) {
        return h(LoginView, { onLogin: handleLogin });
    }

    return h(DashboardPanel, { 
        currentUser, 
        onLogout: handleLogout,
        weeklyData: weeklyData,
        onUpdateData: handleDaylinUpdate,
        awards: awards,
        onCreateAward: handleCreateAward,
        allUsers: users,
        theme: theme,
        onSetTheme: setTheme,
        onUpdatePassword: handleUpdatePassword
    });
};

render(h(App, null), document.getElementById('root'));