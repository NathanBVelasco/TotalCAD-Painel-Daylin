
import { render } from 'preact';
import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
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

// --- ENHANCED MOCK DATA FOR TESTING ---
const mockAwards = [
  { id: 101, title: 'Rei das Vendas de Trimble', description: 'Atinja R$ 80.000 em vendas totais para ganhar um bônus.', metric: 'totalSales', target: 80000, reward: 'R$ 500 Bônus', expiryDate: '2024-12-31', assignedTo: [1, 2, 3, 4, 5, 6, 7], completedBy: [1, 3] },
  { id: 102, title: 'Mestre do Onboarding', description: 'Complete 10 onboardings para ganhar um dia de folga.', metric: 'onboardingCount', target: 10, reward: '1 Dia de Folga', expiryDate: '2024-12-31', assignedTo: [1, 2, 3, 4], completedBy: [] },
  { id: 103, title: 'Campeão de Cross-Sell', description: 'Faça 15 cross-sells e ganhe um jantar especial.', metric: 'crossSellingCount', target: 15, reward: 'Jantar (R$ 200)', expiryDate: '2024-12-31', assignedTo: [5, 6, 7], completedBy: [] },
];

const mockWeeklyData = {
  startOfWeek: getStartOfWeek(),
  users: {
    1: { Trimble: { toRenew: 15, renewed: 12 }, Chaos: { toRenew: 8, renewed: 7 }, onboarding: 8, crossSelling: 5, totalSales: 82500 },
    2: { Trimble: { toRenew: 12, renewed: 10 }, Chaos: { toRenew: 10, renewed: 8 }, onboarding: 9, crossSelling: 12, totalSales: 68000 },
    3: { Trimble: { toRenew: 20, renewed: 15 }, Chaos: { toRenew: 5, renewed: 5 }, onboarding: 5, crossSelling: 8, totalSales: 91000 },
    4: { Trimble: { toRenew: 8, renewed: 4 }, Chaos: { toRenew: 6, renewed: 6 }, onboarding: 3, crossSelling: 4, totalSales: 48000 },
    5: { Trimble: { toRenew: 25, renewed: 22 }, Chaos: { toRenew: 12, renewed: 10 }, onboarding: 12, crossSelling: 14, totalSales: 115000 },
    6: { Trimble: { toRenew: 18, renewed: 15 }, Chaos: { toRenew: 9, renewed: 7 }, onboarding: 7, crossSelling: 10, totalSales: 75000 },
    7: { Trimble: { toRenew: 10, renewed: 9 }, Chaos: { toRenew: 11, renewed: 8 }, onboarding: 6, crossSelling: 9, totalSales: 61000 }
  }
};

const mockNotifications = [
    { id: 1001, recipientId: 8, type: 'award_completed_manager', awardId: 101, salespersonName: 'Ana Silva', message: `Ana Silva concluiu o prêmio "Rei das Vendas de Trimble".`, read: false },
    { id: 1002, recipientId: 8, type: 'award_completed_manager', awardId: 101, salespersonName: 'Carla Dias', message: `Carla Dias concluiu o prêmio "Rei das Vendas de Trimble".`, read: true },
    { id: 1003, recipientId: 1, type: 'award_completed_salesperson', awardId: 101, message: `Parabéns! Você concluiu o prêmio "Rei das Vendas de Trimble".`, read: true },
    { id: 1004, recipientId: 3, type: 'award_completed_salesperson', awardId: 101, message: `Parabéns! Você concluiu o prêmio "Rei das Vendas de Trimble".`, read: false },
];

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
const IconDashboard = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "currentColor", viewBox: "0 0 24 24" }, h('path', { d: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" }));
const IconDaylin = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "currentColor", viewBox: "0 0 24 24" }, h('path', { d: "M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z" }));
const IconAwards = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "currentColor", viewBox: "0 0 24 24" }, h('path', { d: "M18.83 4H5.17L4 7.21V12c0 2.21 1.79 4 4 4h1c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1H8v2h8v-2h-1c-.55 0-1-.45-1-1v-2c0-.55.45-1 1-1h1c2.21 0 4-1.79 4-4V7.21L18.83 4zM12 11c-1.1 0-2-.9-2-2V5h4v4c0 1.1-.9 2-2 2zM5.21 6h13.58l.6 1.79H4.61L5.21 6z" }));
const IconRanking = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "currentColor", viewBox: "0 0 24 24" }, h('path', { d: "M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z" }));
const IconSettings = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "currentColor", viewBox: "0 0 24 24" }, h('path', { d: "M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" }));
const IconSparkles = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "stroke-width": "1.5", stroke: "currentColor" }, h('path', { "stroke-linecap": "round", "stroke-linejoin": "round", d: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM18 15.75l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 18l-1.035.259a3.375 3.375 0 00-2.456 2.456L18 21.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 18l1.035-.259a3.375 3.375 0 002.456-2.456L18 15.75z" }));
const IconLogout = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "stroke-width": "1.5", stroke: "currentColor" }, h('path', { "stroke-linecap": "round", "stroke-linejoin": "round", d: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" }));
const IconChartBar = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "stroke-width": "1.5", stroke: "currentColor" }, h('path', { "stroke-linecap": "round", "stroke-linejoin": "round", d: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" }));
const IconTrophy = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "stroke-width": "1.5", stroke: "currentColor" }, h('path', { "stroke-linecap": "round", "stroke-linejoin": "round", d: "M16.5 18.75h-9a3 3 0 00-3 3h15a3 3 0 00-3-3zM12 6.75a3 3 0 013 3v3.75a3 3 0 01-3 3h-3.75a3 3 0 01-3-3V9.75a3 3 0 013-3H12zM12 21v-2.25m0 0a3 3 0 003-3H9a3 3 0 003 3z" }));

// New Dashboard Icons
const IconAutorenew = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" }, h('path', { d: "M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z" }));
const IconTrendingUp = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" }, h('path', { d: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" }));
const IconPersonRemove = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" }, h('path', { d: "M15 8c0-2.21-1.79-4-4-4S7 5.79 7 8s1.79 4 4 4 4-1.79 4-4zm-2-3h-4v2h4V5zM1 18v2h16v-2c0-2.66-5.33-4-8-4s-8 1.34-8 4zm18-5v2h-6v-2h6z" }));
const IconPersonAdd = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" }, h('path', { d: "M15 8c0-2.21-1.79-4-4-4S7 5.79 7 8s1.79 4 4 4 4-1.79 4-4zm-2-3h-4v2h4V5zm-2 8c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm6-3v-3h-2v3h-3v2h3v3h2v-3h3v-2h-3z" }));
const IconPayments = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" }, h('path', { d: "M19 14V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-9-4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM3 6h14v2H3V6z" }));


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
                h(StatCard, { title: 'Qtd de Licenças a Renovar', value: devData.toRenew, icon: IconAutorenew }),
                h(StatCard, { title: 'Taxa de Renovação', value: renewalRate.toFixed(1), unit: '%', icon: IconTrendingUp }),
                h(StatCard, { title: 'Churn', value: churn.toFixed(1), unit: '%', icon: IconPersonRemove }),
                h(StatCard, { title: 'Onboarding', value: aggregatedData.onboarding, icon: IconPersonAdd }),
                h(StatCard, { title: 'Cross Selling', value: aggregatedData.crossSelling, icon: IconPayments })
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
            h(StatCard, { title: 'Minhas Licenças a Renovar', value: devData.toRenew, icon: IconAutorenew }),
            h(StatCard, { title: 'Minha Taxa de Renovação', value: renewalRate.toFixed(1), unit: '%', target: 70, targetLogic: 'higherIsBetter', icon: IconTrendingUp }),
            h(StatCard, { title: 'Meu Churn', value: churn.toFixed(1), unit: '%', target: 30, targetLogic: 'lowerIsBetter', icon: IconPersonRemove }),
            h(StatCard, { title: 'Meus Onboardings', value: userWeeklyData.onboarding, icon: IconPersonAdd }),
            h(StatCard, { title: 'Meu Cross Selling', value: userWeeklyData.crossSelling, icon: IconPayments })
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
    const isCompletedByMe = award.completedBy?.includes(currentUser.id);

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

    return h('div', { class: `award-card ${isCompletedByMe ? 'completed' : ''}` },
        isCompletedByMe && h('div', { class: 'completed-badge' }, h(IconTrophy, null), 'Concluído'),
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
                    const isCompletedByUser = award.completedBy?.includes(userId);
                    const { currentValue: userCurrent, percentage: userPercentage } = calculateProgress(user, award, weeklyData);
                    return h('li', null, 
                        h('span', null, `${user.name}: ${formatValue(userCurrent)} / ${formatValue(award.target)}`, isCompletedByUser && ' (Concluído)'),
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
            h(RankCard, { title: 'Sua Posição em Vendas', rank: mySalesRank, total: totalSalespeople, icon: IconPayments }),
            h(RankCard, { title: 'Sua Posição em Renovação Trimble', rank: myTrimbleRank, total: totalSalespeople, icon: IconTrendingUp }),
            h(RankCard, { title: 'Sua Posição em Renovação Chaos', rank: myChaosRank, total: totalSalespeople, icon: IconTrendingUp })
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

const AwardCompletionModal = ({ award, onClose }) => {
    if (!award) return null;

    return h('div', { class: 'modal-overlay achievement-overlay' },
        h('div', { class: 'modal-content achievement-modal' },
            h('div', { class: 'achievement-icon' }, h(IconTrophy, null)),
            h('h2', null, 'Meta Atingida!'),
            h('p', { class: 'achievement-subtitle' }, 'Parabéns por concluir o prêmio:'),
            h('h3', { class: 'achievement-title' }, award.title),
            h('p', { class: 'achievement-reward' }, 'Sua recompensa: ', h('strong', null, award.reward)),
            h('div', { class: 'modal-footer' },
                h('button', { class: 'btn', onClick: onClose }, 'OK')
            )
        )
    );
};

const NotificationPanel = ({ notifications, onMarkAllRead, onClose }) => {
    const unreadCount = notifications.filter(n => !n.read).length;
    const panelRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return h('div', { class: 'notification-panel', ref: panelRef },
        h('div', { class: 'notification-panel-header' },
            h('h4', null, 'Notificações'),
            unreadCount > 0 && h('button', { onClick: onMarkAllRead, class: 'mark-read-btn' }, 'Marcar todas como lidas')
        ),
        h('div', { class: 'notification-list' },
            notifications.length > 0 ?
                notifications.map(n => h('div', { class: `notification-item ${!n.read ? 'unread' : ''}`, key: n.id },
                    h(IconTrophy, null),
                    h('p', null, n.message)
                )) :
                h('div', { class: 'notification-empty' }, 'Nenhuma notificação nova.')
        )
    );
};

const NotificationBell = ({ notifications, onMarkAllRead }) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleToggle = (e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };
    
    const handleClose = () => setIsOpen(false);

    return h('div', { class: 'notification-bell' },
        h('button', { onClick: handleToggle, class: 'notification-btn' },
            h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", 'stroke-width': "1.5", stroke: "currentColor" }, 
                h('path', { 'stroke-linecap': "round", 'stroke-linejoin': "round", d: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" })
            ),
            unreadCount > 0 && h('span', { class: 'notification-badge' }, unreadCount)
        ),
        isOpen && h(NotificationPanel, { notifications, onMarkAllRead, onClose: handleClose })
    );
};

const DashboardPanel = ({ currentUser, onLogout, weeklyData, onUpdateData, awards, onCreateAward, allUsers, theme, onSetTheme, onUpdatePassword, notifications, onMarkAllManagerNotificationsRead }) => {
    const [activeTab, setActiveTab] = useState('Dashboard');

    const tabs = [
        { name: 'Dashboard', icon: IconDashboard },
        { name: 'Daylin', icon: IconDaylin },
        { name: 'Prêmios', icon: IconAwards },
        { name: 'Ranking', icon: IconRanking },
        { name: 'Configurações', icon: IconSettings },
    ];
    
    const managerNotifications = useMemo(() => {
        if (currentUser.role === 'Manager') {
            return notifications.filter(n => n.recipientId === currentUser.id).sort((a,b) => b.id - a.id);
        }
        return [];
    }, [notifications, currentUser]);

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
            h('div', { class: 'header-right' },
                h('div', { class: 'user-info' }, `Olá, ${currentUser.name.split(' ')[0]}`),
                currentUser.role === 'Manager' && h(NotificationBell, {
                    notifications: managerNotifications,
                    onMarkAllRead: onMarkAllManagerNotificationsRead,
                })
            )
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
    const [notifications, setNotifications] = useState([]);
    const [completedAwardInfo, setCompletedAwardInfo] = useState(null);

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
                setWeeklyData(mockWeeklyData);
                localStorage.setItem('weeklyData', JSON.stringify(mockWeeklyData));
            }
        } else {
            setWeeklyData(mockWeeklyData);
            localStorage.setItem('weeklyData', JSON.stringify(mockWeeklyData));
        }
        
        // Load awards, ensuring `completedBy` array exists
        const storedAwards = localStorage.getItem('awards');
        if (storedAwards) {
            const parsedAwards = JSON.parse(storedAwards).map(a => ({ ...a, completedBy: a.completedBy || [] }));
            setAwards(parsedAwards);
        } else {
            setAwards(mockAwards);
            localStorage.setItem('awards', JSON.stringify(mockAwards));
        }


        // Load notifications
        const storedNotifications = localStorage.getItem('notifications');
        if (storedNotifications) {
            setNotifications(JSON.parse(storedNotifications));
        } else {
            setNotifications(mockNotifications);
            localStorage.setItem('notifications', JSON.stringify(mockNotifications));
        }
    }, []);

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'Salesperson') return;

        const unreadCongrats = notifications.find(n =>
            n.recipientId === currentUser.id &&
            n.type === 'award_completed_salesperson' &&
            !n.read
        );

        if (unreadCongrats) {
            const award = awards.find(a => a.id === unreadCongrats.awardId);
            if (award) {
                setCompletedAwardInfo({ award, notificationId: unreadCongrats.id });
            }
        }
    }, [notifications, awards, currentUser]);

    const handleLogin = (user) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
    };

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
    };

    const handleMarkNotificationRead = (notificationId) => {
        setNotifications(prev => {
            const newNotifications = prev.map(n => n.id === notificationId ? { ...n, read: true } : n);
            localStorage.setItem('notifications', JSON.stringify(newNotifications));
            return newNotifications;
        });
    };

    const handleMarkAllManagerNotificationsRead = () => {
        if (!currentUser || currentUser.role !== 'Manager') return;
        setNotifications(prev => {
            const newNotifications = prev.map(n => n.recipientId === currentUser.id ? { ...n, read: true } : n);
            localStorage.setItem('notifications', JSON.stringify(newNotifications));
            return newNotifications;
        });
    }

    const checkAndGenerateNotifications = (updatedWeeklyData) => {
        setAwards(currentAwards => {
            const manager = users.find(u => u.role === 'Manager');
            if (!manager) return currentAwards;

            let newNotifications = [];
            const awardsToUpdate = JSON.parse(JSON.stringify(currentAwards));

            awardsToUpdate.forEach(award => {
                award.assignedTo.forEach(userId => {
                    const isAlreadyCompleted = award.completedBy?.includes(userId);
                    if (isAlreadyCompleted) return;

                    const user = users.find(u => u.id === userId);
                    if (!user) return;
                    
                    const { currentValue } = calculateProgress(user, award, updatedWeeklyData);

                    if (currentValue >= award.target) {
                        award.completedBy.push(userId);

                        const salespersonNotification = {
                            id: Date.now() + Math.random(),
                            recipientId: userId,
                            type: 'award_completed_salesperson',
                            awardId: award.id,
                            message: `Parabéns! Você concluiu o prêmio "${award.title}".`,
                            read: false
                        };
                        const managerNotification = {
                            id: Date.now() + 1 + Math.random(),
                            recipientId: manager.id,
                            type: 'award_completed_manager',
                            awardId: award.id,
                            salespersonName: user.name,
                            message: `${user.name} concluiu o prêmio "${award.title}".`,
                            read: false
                        };
                        newNotifications.push(salespersonNotification, managerNotification);
                    }
                });
            });

            if (newNotifications.length > 0) {
                localStorage.setItem('awards', JSON.stringify(awardsToUpdate));
                setNotifications(prev => {
                    const allNotifications = [...prev, ...newNotifications];
                    localStorage.setItem('notifications', JSON.stringify(allNotifications));
                    return allNotifications;
                });
                return awardsToUpdate;
            }

            return currentAwards;
        });
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
            
            checkAndGenerateNotifications(newData);

            return newData;
        });
    };
    
    const handleCreateAward = (newAward) => {
        setAwards(prevAwards => {
            const updatedAwards = [...prevAwards, { ...newAward, id: Date.now(), completedBy: [] }];
            localStorage.setItem('awards', JSON.stringify(updatedAwards));
            return updatedAwards;
        });
    };

    const handleUpdatePassword = (newPassword) => {
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].password = newPassword;
            const updatedUser = { ...currentUser, password: newPassword };
            setCurrentUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
    };
    
    const handleCloseCompletionModal = () => {
        if (completedAwardInfo) {
            handleMarkNotificationRead(completedAwardInfo.notificationId);
        }
        setCompletedAwardInfo(null);
    };

    if (!currentUser) {
        return h(LoginView, { onLogin: handleLogin });
    }

    return h('div', null,
        completedAwardInfo && h(AwardCompletionModal, { award: completedAwardInfo.award, onClose: handleCloseCompletionModal }),
        h(DashboardPanel, { 
            currentUser, 
            onLogout: handleLogout,
            weeklyData: weeklyData,
            onUpdateData: handleDaylinUpdate,
            awards: awards,
            onCreateAward: handleCreateAward,
            allUsers: users,
            theme: theme,
            onSetTheme: setTheme,
            onUpdatePassword: handleUpdatePassword,
            notifications: notifications,
            onMarkAllManagerNotificationsRead: handleMarkAllManagerNotificationsRead
        })
    );
};

render(h(App, null), document.getElementById('root'));
