import React, { useState, useEffect, useMemo } from 'react';
import { Play, Users, BarChart2, CheckCircle, Clock, FileText, AlertTriangle, Activity, Briefcase, Percent, Sun, Moon, Zap, TrendingUp, Clock4, Car, X, Cpu, UserPlus, Type } from 'lucide-react';

const SimulationApp = () => {
  const [numAgents, setNumAgents] = useState(1000);
  const [conflictLevel, setConflictLevel] = useState('medium');
  
  // 상태 관리: idle -> simulating -> revealing -> finished
  const [phase, setPhase] = useState('idle'); 
  const [currentStep, setCurrentStep] = useState(0);
  const [revealIndex, setRevealIndex] = useState(-1);
  
  // 메인 화면 그래프 부드러운 스와이프 애니메이션 (0~100%)
  const [revealWipe, setRevealWipe] = useState(0);

  // 상세 프레젠테이션 모달 상태
  const [activeDetail, setActiveDetail] = useState(null);
  const [modalTime, setModalTime] = useState(0); // 0 ~ 8000ms
  
  const [simulationData, setSimulationData] = useState([]);
  const [fullData, setFullData] = useState([]);
  
  // [수정됨] 사용자가 요청한 새로운 4단계 프로세스 적용
  const stepsConfig = [
    { turn: 1, name: '전문가 의견 제시 (1단계)', desc: '제시된 주제에 대하여 전문가들의 찬반의견 내지 적정수치 제시' },
    { turn: 2, name: '필수열람의견 순위 갱신 (2단계)', desc: '1단계 전문가 의견에 참여자들이 점수를 부여하여 우선순위 갱신' },
    { turn: 3, name: '참여자 수치 제시 (3단계)', desc: '갱신된 필수열람의견(배경지식)을 열람한 후 참여자들이 찬반/수치 제시' },
    { turn: 4, name: '집단지성 최종 도출 (4단계)', desc: '수렴된 다수의 참여자 의견을 모아 집단지성 최종의견 및 수치 확정' }
  ];

  const metricsOrder = ['agree', 'ratioA', 'opHours', 'startHrDay', 'expRate'];

  // [이펙트 1] 메인 턴별 데이터 시뮬레이션
  useEffect(() => {
    let timer;
    if (phase === 'simulating' && fullData.length > 0) {
      if (simulationData.length < fullData.length) {
        timer = setTimeout(() => {
          setSimulationData(prev => [...prev, fullData[prev.length]]);
          setCurrentStep(prev => prev + 1);
        }, 1200);
      } else {
        setTimeout(() => {
          setPhase('revealing');
          setRevealIndex(0);
        }, 1000);
      }
    }
    return () => clearTimeout(timer);
  }, [phase, fullData, simulationData]);

  // [이펙트 2] 지표별 순차 하이라이트 애니메이션
  useEffect(() => {
    let timer;
    if (phase === 'revealing') {
      if (revealIndex < metricsOrder.length - 1) {
        timer = setTimeout(() => setRevealIndex(r => r + 1), 2500); 
      } else {
        timer = setTimeout(() => setPhase('finished'), 2500);
      }
    }
    return () => clearTimeout(timer);
  }, [phase, revealIndex]);

  // [이펙트 2-1] 지표 변경 시 메인 그래프가 중간과정을 보이며 스와이프되도록 처리
  useEffect(() => {
    if (phase === 'revealing' || phase === 'finished') {
      setRevealWipe(0); // 지표가 바뀔 때마다 0으로 초기화
      let start = performance.now();
      const duration = 1500; // 1.5초에 걸쳐 부드럽게 그려짐
      let rafId;
      const animate = (time) => {
        let elapsed = time - start;
        if (elapsed > duration) elapsed = duration;
        setRevealWipe((elapsed / duration) * 100);
        if (elapsed < duration) {
          rafId = requestAnimationFrame(animate);
        }
      };
      rafId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(rafId);
    }
  }, [revealIndex, phase]);

  // [이펙트 3] 상세 모달 8초(8000ms) 라이브 프레젠테이션 타이머
  useEffect(() => {
    let rafId;
    let start;
    if (activeDetail) {
      start = performance.now();
      const animate = (time) => {
        let elapsed = time - start;
        if (elapsed > 8000) elapsed = 8000;
        setModalTime(elapsed);
        if (elapsed < 8000) {
          rafId = requestAnimationFrame(animate);
        }
      };
      rafId = requestAnimationFrame(animate);
    } else {
      setModalTime(0);
    }
    return () => cancelAnimationFrame(rafId);
  }, [activeDetail]);

  const rand = (min, max) => min + Math.random() * (max - min);

  // 데이터 시뮬레이션 로직
  const runSimulationLogic = () => {
    let m = conflictLevel === 'high' ? 1.5 : conflictLevel === 'low' ? 0.5 : 1.0;
    const getAvg = (gA, gB, mgmt) => (gA * 0.4) + (gB * 0.4) + (mgmt * 0.2);
    const smooth = (val, target, factor) => val + (target - val) * factor;

    const finalAgree = rand(95, 99);
    const finalRatioA = rand(35, 40); 
    const finalOpHours = rand(15, 18); 
    const finalStartHr = [8, 9, 10][Math.floor(Math.random() * 3)]; 
    const finalStartDay = [0, 1][Math.floor(Math.random() * 2)]; 
    const finalExpRate = rand(12, 18); 

    // 1단계: 전문가 의견 제시 (초기 수치)
    let t1 = {
      turn: 1, agree: { a: 85, b: 40, m: 30 }, ratioA: { a: 15, b: 60, m: 25 }, 
      opHours: { a: 12, b: 20, m: 24 }, startHr: { a: 10, b: 6, m: 7 }, 
      startDay: { a: 2, b: 0, m: 1 }, expRate: { a: 25, b: 10, m: 0 }
    };
    const setAverages = (t) => {
      ['agree', 'ratioA', 'opHours', 'startHr', 'startDay', 'expRate'].forEach(key => {
        t[key].avg = getAvg(t[key].a, t[key].b, t[key].m);
      });
    };
    setAverages(t1);

    // 2단계: 참여자들의 전문가 의견 점수 부여 및 순위 갱신
    let t2 = { turn: 2, agree: {}, ratioA: {}, opHours: {}, startHr: {}, startDay: {}, expRate: {} };
    ['agree', 'ratioA', 'opHours', 'startHr', 'startDay', 'expRate'].forEach(key => {
      t2[key].a = smooth(t1[key].a, t1[key].avg, 0.4);
      t2[key].b = smooth(t1[key].b, t1[key].avg, 0.4);
      t2[key].m = smooth(t1[key].m, t1[key].avg, 0.4);
    });
    setAverages(t2);

    // 3단계: 필수열람 후 참여자 찬반 및 수치 제시
    let t3 = { turn: 3, agree: {}, ratioA: {}, opHours: {}, startHr: {}, startDay: {}, expRate: {} };
    ['agree', 'ratioA', 'opHours', 'startHr', 'startDay', 'expRate'].forEach(key => {
      t3[key].a = smooth(t2[key].a, t2[key].avg, 0.7);
      t3[key].b = smooth(t2[key].b, t2[key].avg, 0.7);
      t3[key].m = smooth(t2[key].m, t2[key].avg, 0.7);
    });
    setAverages(t3);

    // 4단계: 집단지성 최종 도출
    let t4 = { turn: 4, agree: {}, ratioA: {}, opHours: {}, startHr: {}, startDay: {}, expRate: {} };
    t4.agree = { a: finalAgree+1, b: finalAgree-1, m: finalAgree, avg: finalAgree };
    t4.ratioA = { a: finalRatioA, b: finalRatioA, m: finalRatioA, avg: finalRatioA }; 
    t4.opHours = { a: finalOpHours, b: finalOpHours, m: finalOpHours, avg: finalOpHours }; 
    t4.startHr = { a: finalStartHr, b: finalStartHr, m: finalStartHr, avg: finalStartHr }; 
    t4.startDay = { a: finalStartDay, b: finalStartDay, m: finalStartDay, avg: finalStartDay }; 
    t4.expRate = { a: finalExpRate, b: finalExpRate, m: finalExpRate, avg: finalExpRate }; 

    return [t1, t2, t3, t4];
  };

  const handleStart = () => {
    if (phase !== 'idle' && phase !== 'finished') return;
    setPhase('simulating');
    setCurrentStep(0);
    setRevealIndex(-1);
    setRevealWipe(0);
    setSimulationData([]);
    setFullData(runSimulationLogic());
  };

  const openDetailModal = (metricKey) => {
    if (phase !== 'finished' && phase !== 'revealing') return;
    setActiveDetail(metricKey);
    setModalTime(0);
  };

  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const activeMetricKey = revealIndex >= 0 ? metricsOrder[revealIndex] : 'agree';
  const currentData = simulationData.length > 0 ? simulationData[simulationData.length - 1] : null;

  const actualKeyInModal = activeDetail === 'startHrDay' ? 'startHr' : activeDetail;

  const metricMeta = {
    agree: { title: '4조2교대 찬성률', max: 100, unit: '%', color: '#2563eb' },
    ratioA: { title: 'A조(주중 오전) 비중', max: 100, unit: '%', color: '#059669' },
    opHours: { title: '하루 가동시간', max: 24, unit: '시간', color: '#d97706' },
    startHrDay: { title: 'A조 시작기준', max: 24, unit: '시', color: '#7c3aed' },
    expRate: { title: '고용확대율', max: 50, unit: '%', color: '#db2777' },
  };

  const getCoords = (index, value, maxVal, widthMultiplier = 166.6) => {
    const x = 50 + (index * widthMultiplier); 
    const y = 170 - ((value || 0) / maxVal) * 140; 
    return `${x},${y}`;
  };

  const getModalCoords = (index, value, maxVal) => {
    const x = 30 + (index * 4.375); 
    const y = 220 - ((value || 0) / maxVal) * 180;
    return `${x},${y}`;
  };

  // 메인 차트 클립 마스크 폭 설정 (시뮬레이션 중에는 단계별로, 리뷰 중에는 부드러운 스와이프 적용)
  const clipWidth = phase === 'idle' ? 0 : phase === 'simulating' ? (currentStep / 3) * 100 : revealWipe;

  let assignment = null;
  if (currentData) {
    const totalWorkers = Math.round(numAgents * (1 + currentData.expRate.avg / 100));
    const added = totalWorkers - numAgents;
    const teamA = Math.round(totalWorkers * (currentData.ratioA.avg / 100));
    const teamB = Math.round(totalWorkers * rand(0.22, 0.25)); 
    const teamC = Math.round(totalWorkers * rand(0.22, 0.25));
    const teamD = totalWorkers - teamA - teamB - teamC;
    assignment = { total: totalWorkers, added, teamA, teamB, teamC, teamD };
  }

  // 모달 동적 라이브 차트 생성 로직
  const detailChartData = useMemo(() => {
    if (!activeDetail || fullData.length < 4) return [];
    const points = [];
    const v0 = fullData[0][actualKeyInModal];
    const vFinal = fullData[3][actualKeyInModal];
    
    for (let i = 0; i <= 80; i++) {
      const t = i / 80; 
      let a, b, m;

      if (activeDetail === 'agree') {
        const noise = Math.sin(t * Math.PI * 10) * (1 - t) * 3; 
        if (t < 0.25) { 
          a = v0.a; b = v0.b; m = v0.m;
        } else if (t < 0.5) { 
          const p = (t - 0.25) / 0.25;
          a = v0.a - (15 * p) + noise; 
          b = v0.b - (10 * p) + noise;
          m = v0.m - (10 * p) + noise;
        } else if (t < 0.8) { 
          const p = (t - 0.5) / 0.3;
          a = (v0.a - 15) + ((vFinal.a + 2 - (v0.a - 15)) * p) + noise;
          b = (v0.b - 10) + ((vFinal.b - (v0.b - 10)) * p) + noise;
          m = (v0.m - 10) + ((vFinal.m - (v0.m - 10)) * p) + noise;
        } else { 
          const p = (t - 0.8) / 0.2;
          a = (vFinal.a + 2) - (2 * p); 
          b = vFinal.b;
          m = vFinal.m;
        }
      } else {
        if (t < 0.33) { a = v0.a; b = v0.b; m = v0.m; }
        else if (t < 0.66) { 
          const p = (t - 0.33) / 0.33; 
          a = v0.a + (vFinal.a - v0.a) * p; b = v0.b + (vFinal.b - v0.b) * p; m = v0.m + (vFinal.m - v0.m) * p;
        }
        else { a = vFinal.a; b = vFinal.b; m = vFinal.m; }
      }
      points.push({ a: Math.max(0, a), b: Math.max(0, b), m: Math.max(0, m), avg: (a*0.4 + b*0.4 + m*0.2) });
    }
    points[80].a = vFinal.a; points[80].b = vFinal.b; points[80].m = vFinal.m; points[80].avg = vFinal.avg;
    return points;
  }, [activeDetail, actualKeyInModal, fullData]);

  // 사용자 맞춤형 표 8 찬반 배경지식 데이터 완벽 적용
  const consKnowledge = [
    "1. 근무시간 증가로 인한 매출 향상이 불확실하다",
    "2. 팀별 인원의 한계로 4개조의 구성이 어렵다",
    "3. 고용 확대시 인건비의 부담이 있다"
  ];
  const prosKnowledge = [
    "1. 업무 트래픽 분산으로 생산성이 향상된다",
    "2. 휴가시간 증가로 근로자의 삶의 질의 향상된다",
    "3. 사무실 유지비용의 절감이 가능하다"
  ];

  const getTypewriterText = (textArray, startMs, endMs, currentTime) => {
    if (currentTime < startMs) return [];
    if (currentTime > endMs) return textArray;
    const duration = endMs - startMs;
    const progress = (currentTime - startMs) / duration;
    const totalChars = textArray.join('').length;
    const charsToShow = Math.floor(totalChars * progress);
    
    let currentChars = 0;
    return textArray.map(line => {
      if (currentChars >= charsToShow) return "";
      if (currentChars + line.length <= charsToShow) {
        currentChars += line.length; return line;
      }
      const remain = charsToShow - currentChars;
      currentChars += remain;
      return line.substring(0, remain);
    });
  };

  const currentModalIdx = Math.floor((modalTime / 8000) * 80);
  const currentModalPoint = activeDetail && detailChartData.length > 0 ? detailChartData[currentModalIdx] : null;

  // [수정됨] 상세 모달창의 8단계 프레젠테이션 로그 텍스트 (신규 4단계 로직 반영)
  const detailStepsText = [
    "[1단계] 주제에 대한 전문가 찬반의견 및 적정수치 데이터 수집",
    "[1단계] 수집된 전문가 초기 데이터를 그룹별(2030, 4050, 사측) 맵핑",
    "[2단계] 1단계 전문가 의견에 대한 참여자 평가 및 점수 부여 가동",
    "[2단계] 참여자들의 부여 점수를 합산하여 필수열람의견 우선순위 갱신",
    "[3단계] 갱신된 최상위 필수열람의견을 전 참여자에게 배경지식으로 제공",
    "[3단계] 배경지식 열람을 통한 페르소나별 1차 수치 제시 및 동조화",
    "[4단계] 다수 참여자의 1차 조정 데이터 기반 다중 회귀 분석(특허 2항)",
    "[4단계] 최종 다수결 수렴값 연산 완료, 집단지성 최종수치(결과) 확정"
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800 relative">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">특허 1(집단지성) & 특허 3(고용창출)</span>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">다중 에이전트 시뮬레이션 PRO</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">도면 8 & 11 집단지성 4단계 프로세스 실증</h1>
          </div>
          <button 
            onClick={handleStart} 
            disabled={phase === 'simulating' || phase === 'revealing'}
            className="mt-4 md:mt-0 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {phase === 'simulating' || phase === 'revealing' ? <><Clock className="w-5 h-5 mr-2 animate-spin" /> 연산 진행중...</> : <><Play className="w-5 h-5 mr-2" /> 시뮬레이션 시작</>}
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* 좌측 패널: 설정 */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
              <h2 className="text-lg font-bold mb-4 flex items-center"><Users className="w-5 h-5 mr-2 text-slate-700" /> 참여자 설정 및 페르소나</h2>
              <div className="space-y-4 mb-5">
                <label className="block text-sm font-semibold text-slate-700">기존 사업장 총 인원: <span className="text-blue-600">{numAgents.toLocaleString()}명</span></label>
                <input type="range" min="100" max="5000" step="100" value={numAgents} onChange={(e) => setNumAgents(Number(e.target.value))} disabled={phase !== 'idle' && phase !== 'finished'} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"/>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span><span className="font-bold text-slate-700">2030 에이전트 (40%)</span></div>
                  <span className="text-xs text-slate-500">워라밸 선호</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center"><span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span><span className="font-bold text-slate-700">4050 에이전트 (40%)</span></div>
                  <span className="text-xs text-slate-500">주간근무 선호</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span><span className="font-bold text-slate-700">사측 관리자 (20%)</span></div>
                  <span className="text-xs text-slate-500">효율성 선호</span>
                </div>
              </div>
            </div>

            {/* 수렴 프로세스 요약 로그 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-sm text-slate-700 mb-4 flex items-center"><FileText className="w-4 h-4 mr-2" /> 요약 프로세스 (4단계)</h3>
              <div className="space-y-3">
                {stepsConfig.map((step, idx) => {
                  const isActive = currentStep > idx;
                  const isCurrent = currentStep === idx && phase === 'simulating';
                  return (
                    <div key={idx} className={`flex p-3 rounded-lg border transition-all duration-500 ${isActive ? 'bg-slate-50 border-slate-200' : isCurrent ? 'bg-blue-50 border-blue-200 shadow-sm' : 'opacity-40 border-transparent grayscale'}`}>
                      <div className="mr-3 mt-0.5">
                        {isActive ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm ${isActive || isCurrent ? 'text-slate-800' : 'text-slate-500'}`}>{step.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 우측 패널 */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* 동적 차트 영역 */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 relative overflow-hidden">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center text-slate-800">
                    <BarChart2 className="w-6 h-6 mr-2 text-slate-900" /> 
                    {phase === 'idle' ? '대기중' : metricMeta[activeMetricKey]?.title + ' 수렴 그래프'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {phase === 'simulating' ? '전체 항목의 턴별 집단지성 연산이 진행중입니다...' : phase === 'revealing' ? '도출된 세부 항목별 수렴 그래프를 순차적으로 표시합니다.' : '모든 수렴 연산이 완료되었습니다. 하단 결과 패널을 클릭해 상세 연산을 확인하세요.'}
                  </p>
                </div>
                <div className="flex space-x-3 text-xs font-bold bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 z-10">
                  <span className="flex items-center text-blue-600"><span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>2030</span>
                  <span className="flex items-center text-yellow-600"><span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>4050</span>
                  <span className="flex items-center text-red-600"><span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>사측</span>
                  <span className="flex items-center text-slate-700"><span className="w-2 h-2 bg-slate-800 rounded-full mr-1"></span>평균수렴</span>
                </div>
              </div>

              <div className="w-full h-64 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-center p-4">
                <svg viewBox="0 0 600 200" className="w-full h-full drop-shadow-sm transition-all duration-500" style={{ minWidth: '500px' }}>
                  {/* ClipPath for smooth Left-to-Right drawing for ALL metrics */}
                  <defs>
                    <clipPath id="wipe-clip-main">
                      <rect x="0" y="0" width={`${clipWidth}%`} height="100%" />
                    </clipPath>
                  </defs>

                  {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                    const val = ratio * metricMeta[activeMetricKey].max;
                    return (
                      <g key={ratio}>
                        <line x1="40" y1={170 - (ratio * 140)} x2="560" y2={170 - (ratio * 140)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="35" y={174 - (ratio * 140)} fontSize="10" fill="#94a3b8" textAnchor="end" fontWeight="bold">{val}{metricMeta[activeMetricKey].unit}</text>
                      </g>
                    );
                  })}
                  {/* [수정됨] 차트 하단 진행 라벨을 4단계 프로세스에 맞게 변경 */}
                  {['전문가제시(1단계)', '순위갱신(2단계)', '참여자투표(3단계)', '최종도출(4단계)'].map((label, i) => (
                    <text key={i} x={50 + (i * 166.6)} y="195" fontSize="11" fill="#475569" textAnchor="middle" fontWeight="bold">{label}</text>
                  ))}

                  {/* Draw Lines using FullData, revealed smoothly by ClipPath */}
                  {fullData.length > 0 && (
                    <g clipPath="url(#wipe-clip-main)">
                      <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="5,5" opacity="0.6" 
                        points={fullData.map((d, i) => getCoords(i, d[activeMetricKey === 'startHrDay' ? 'startHr' : activeMetricKey].a, metricMeta[activeMetricKey].max)).join(' ')} />
                      <polyline fill="none" stroke="#eab308" strokeWidth="2.5" strokeDasharray="5,5" opacity="0.6" 
                        points={fullData.map((d, i) => getCoords(i, d[activeMetricKey === 'startHrDay' ? 'startHr' : activeMetricKey].b, metricMeta[activeMetricKey].max)).join(' ')} />
                      <polyline fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="5,5" opacity="0.6" 
                        points={fullData.map((d, i) => getCoords(i, d[activeMetricKey === 'startHrDay' ? 'startHr' : activeMetricKey].m, metricMeta[activeMetricKey].max)).join(' ')} />
                      
                      <polyline fill="none" stroke="#1e293b" strokeWidth="4" 
                        points={fullData.map((d, i) => getCoords(i, d[activeMetricKey === 'startHrDay' ? 'startHr' : activeMetricKey].avg, metricMeta[activeMetricKey].max)).join(' ')} />
                      
                      {/* Dots & Labels rendered along with the clip path */}
                      {fullData.map((d, i) => {
                        const val = d[activeMetricKey === 'startHrDay' ? 'startHr' : activeMetricKey].avg;
                        const coords = getCoords(i, val, metricMeta[activeMetricKey].max).split(',');
                        return (
                          <g key={`pt-full-${i}`}>
                            <circle cx={coords[0]} cy={coords[1]} r="5" fill="#1e293b" stroke="white" strokeWidth="2" />
                            <text x={coords[0]} y={coords[1] - 12} fontSize="12" fill="#0f172a" textAnchor="middle" fontWeight="900">
                              {val.toFixed(1)}{activeMetricKey === 'startHrDay' ? '시' : metricMeta[activeMetricKey].unit}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  )}
                </svg>
                {phase === 'idle' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-[1px] z-20">
                    <div className="text-slate-400 font-bold text-lg">시뮬레이션을 시작해주세요</div>
                  </div>
                )}
              </div>
            </div>

            {/* 항목별 결과 대시보드 (클릭시 모달 오픈) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['agree', 'ratioA', 'opHours', 'startHrDay'].map((key, i) => {
                const isActive = (phase === 'revealing' || phase === 'finished') && (revealIndex >= i);
                const isHighlight = activeMetricKey === key && phase === 'revealing';
                const colorTheme = i === 0 ? 'blue' : i === 1 ? 'emerald' : i === 2 ? 'amber' : 'purple';
                
                let displayVal = '-';
                if (currentData && isActive) {
                  if (key === 'startHrDay') displayVal = `${days[currentData.startDay.avg]}요일 ${currentData.startHr.avg}시`;
                  else if (key === 'opHours') displayVal = `${currentData.opHours.avg.toFixed(1)}시간`;
                  else displayVal = `${currentData[key].avg.toFixed(1)}%`;
                }

                return (
                  <div 
                    key={key}
                    onClick={() => openDetailModal(key)}
                    className={`bg-slate-900 rounded-xl p-4 text-center transition-all duration-500 border-2 cursor-pointer 
                      ${isActive ? 'hover:scale-105 hover:bg-slate-800' : ''}
                      ${isHighlight ? `border-${colorTheme}-400 shadow-[0_0_20px_rgba(var(--tw-color-${colorTheme}-400),0.6)] scale-105 z-10` : isActive ? 'border-slate-700 opacity-90' : 'border-slate-800 opacity-40'}
                    `}
                  >
                    <div className={`text-xs font-bold text-${colorTheme}-300 mb-1`}>{metricMeta[key].title}</div>
                    <div className="text-2xl font-extrabold text-white">{displayVal}</div>
                    {isActive && phase === 'finished' && <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-center animate-pulse"><Activity className="w-3 h-3 mr-1"/>라이브 연산 보기</div>}
                  </div>
                );
              })}
            </div>

            {/* 최종 산출: 고용확대율 및 추가 파급효과 강조 */}
            {phase === 'finished' && assignment && (
              <div className="animate-fade-in-up mt-8 space-y-6">
                
                {/* 고용확대 디스플레이 */}
                <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><UserPlus className="w-48 h-48" /></div>
                  <div className="relative z-10 text-center">
                    <h2 className="text-xl font-bold text-blue-100 mb-4 tracking-wider">집단지성 합의 도출: 최종 고용창출 산출 결과</h2>
                    
                    <div className="flex flex-col md:flex-row items-center justify-center md:space-x-12 mt-4 bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/20">
                      <div className="text-center w-full md:w-1/3">
                        <div className="text-blue-200 font-bold mb-2">도출된 고용확대율</div>
                        <div className="text-5xl font-black drop-shadow-lg text-yellow-300 flex items-center justify-center">
                          {currentData.expRate.avg.toFixed(1)}<Percent className="w-8 h-8 ml-1 opacity-80" />
                        </div>
                      </div>

                      <div className="hidden md:block w-px h-24 bg-white/20"></div>

                      <div className="text-center w-full md:w-2/3 mt-6 md:mt-0">
                        <div className="text-emerald-200 font-bold mb-1">확대 창출된 신규 인원 (증가분)</div>
                        <div className="text-[5rem] leading-none font-black text-emerald-400 drop-shadow-2xl flex items-center justify-center tracking-tighter">
                          <span className="text-5xl mr-2">+</span>{assignment.added.toLocaleString()}
                          <span className="text-3xl font-bold ml-2 mt-4 text-emerald-100">명</span>
                        </div>
                        <div className="text-sm text-blue-200/80 font-medium mt-3 tracking-wide bg-black/20 inline-block px-4 py-1 rounded-full">
                          (적용 후 기존 대비 총 운영 인원: {assignment.total.toLocaleString()}명)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 파급 효과 하이라이트 */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
                  <h2 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center">
                    <Zap className="w-6 h-6 mr-2 text-yellow-500 fill-yellow-500" /> 
                    4조 2교대 체제 전환 파급 효과 (특허 3 & 특허 5)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100 flex flex-col items-center text-center">
                      <div className="bg-emerald-100 p-3 rounded-full mb-3"><TrendingUp className="w-6 h-6 text-emerald-600" /></div>
                      <h3 className="font-bold text-emerald-800 mb-2">임금삭감 없는 고용창출</h3>
                      <p className="text-xs text-emerald-600 leading-relaxed">집단지성으로 도출된 생산성 향상률을 바탕으로 기존 임금을 보전하며 대규모 신규 일자리 창출</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 flex flex-col items-center text-center">
                      <div className="bg-blue-100 p-3 rounded-full mb-3"><Clock4 className="w-6 h-6 text-blue-600" /></div>
                      <h3 className="font-bold text-blue-800 mb-2">근로시간 2/3 수준 축소</h3>
                      <p className="text-xs text-blue-600 leading-relaxed">기존 대비 획기적인 근로시간 단축으로 사실상 '주 3.5일제' 실현 및 근로자 워라밸 극대화</p>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100 flex flex-col items-center text-center">
                      <div className="bg-indigo-100 p-3 rounded-full mb-3"><Car className="w-6 h-6 text-indigo-600" /></div>
                      <h3 className="font-bold text-indigo-800 mb-2">교통정체 완벽 해방</h3>
                      <p className="text-xs text-indigo-600 leading-relaxed">오프피크(Off-peak) 출퇴근으로 지옥철 및 도로 정체를 회피하며 주말 주요 관광지 트래픽 분산 기여</p>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 8초 라이브 디테일 모달 */}
      {activeDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden relative flex flex-col">
            
            <button onClick={() => setActiveDetail(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors z-10">
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 pb-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                  <Cpu className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white">집단지성 실시간 연산 분석기</h2>
                  <p className="text-blue-300 text-sm mt-1">{metricMeta[activeDetail].title} {activeDetail === 'agree' ? '(도면 8 반영)' : ''} 다중 에이전트 수렴 시뮬레이션 [8.0s]</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row flex-1 p-8 pt-0 gap-8">
              
              {/* Left: Typing Area / Animation Area */}
              <div className="w-full md:w-1/2 flex flex-col space-y-4">
                {activeDetail === 'agree' ? (
                  <>
                    <h3 className="text-slate-300 font-bold flex items-center border-b border-slate-700 pb-2"><Type className="w-4 h-4 mr-2 text-rose-400" /> 도면 8: 배경지식 강제 열람 (반대/찬성)</h3>
                    {/* 반대 의견 (0~3500ms) */}
                    <div className="bg-rose-950/30 border border-rose-900/50 p-4 rounded-xl min-h-[120px]">
                      <div className="text-xs font-bold text-rose-400 mb-2">[0.0s] 반대 의견 배경지식 데이터 입력중...</div>
                      <div className="text-sm text-rose-200 space-y-1 font-mono leading-relaxed">
                        {getTypewriterText(consKnowledge, 500, 3500, modalTime).map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    </div>
                    {/* 찬성 의견 (4000~7000ms) */}
                    <div className="bg-emerald-950/30 border border-emerald-900/50 p-4 rounded-xl min-h-[120px]">
                      <div className="text-xs font-bold text-emerald-400 mb-2">[4.0s] 찬성 의견 배경지식 데이터 입력중...</div>
                      <div className="text-sm text-emerald-200 space-y-1 font-mono leading-relaxed">
                        {getTypewriterText(prosKnowledge, 4000, 7000, modalTime).map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-slate-300 font-bold flex items-center border-b border-slate-700 pb-2"><Activity className="w-4 h-4 mr-2 text-blue-400" /> 4단계 집단지성 연산 로그</h3>
                    <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex-1 flex flex-col items-center justify-center text-slate-400 text-sm overflow-hidden relative">
                      
                      {/* [수정됨] 상세 모달창에도 새로운 4단계 프로세스 텍스트 적용 */}
                      <div className="w-full h-full flex flex-col justify-center space-y-3">
                        {detailStepsText.map((text, idx) => {
                          // 8단계를 8000ms(8초) 동안 1초에 1개씩 보여주기 위해 연산 (1000ms 당 1개)
                          const isVisible = modalTime >= idx * 1000;
                          const isCurrent = isVisible && modalTime < (idx + 1) * 1000;
                          // 7.5초 이상이면 마지막 단계가 current 로 고정되도록 처리
                          const isLastAndFinal = idx === 7 && modalTime >= 7000;
                          
                          return (
                            <div 
                              key={idx} 
                              className={`flex items-center p-2 rounded-lg border transition-all duration-300 transform ${
                                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 hidden'
                              } ${isCurrent || isLastAndFinal ? 'bg-blue-900/40 border-blue-500/50 text-white font-bold shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-transparent border-transparent text-slate-500'}`}
                            >
                              {(isCurrent && !isLastAndFinal) ? <Clock className="w-4 h-4 mr-3 text-blue-400 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" />}
                              <div className="text-xs">{text}</div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </>
                )}
              </div>

              {/* Right: Live Dynamic SVG Chart */}
              <div className="w-full md:w-1/2 flex flex-col">
                <h3 className="text-slate-300 font-bold flex items-center border-b border-slate-700 pb-2"><BarChart2 className="w-4 h-4 mr-2 text-blue-400" /> 실시간 에이전트 수치 변동</h3>
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl mt-4 flex-1 p-4 relative overflow-hidden">
                  
                  <div className="absolute top-3 right-3 flex space-x-2 text-[10px] font-bold z-10">
                    <span className="flex items-center text-blue-400"><span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>2030</span>
                    <span className="flex items-center text-yellow-400"><span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>4050</span>
                    <span className="flex items-center text-red-400"><span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>사측</span>
                  </div>

                  <svg viewBox="0 0 400 250" className="w-full h-full">
                    {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                      const val = ratio * metricMeta[activeDetail].max;
                      return (
                        <g key={ratio}>
                          <line x1="30" y1={220 - (ratio * 180)} x2="380" y2={220 - (ratio * 180)} stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                          <text x="25" y={224 - (ratio * 180)} fontSize="10" fill="#64748b" textAnchor="end">{val}</text>
                        </g>
                      );
                    })}
                    {[0, 2, 4, 6, 8].map(sec => (
                      <g key={sec}>
                        <text x={30 + (sec * 43.75)} y="240" fontSize="10" fill="#64748b" textAnchor="middle">{sec}s</text>
                      </g>
                    ))}

                    <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" opacity="0.8"
                      points={detailChartData.slice(0, currentModalIdx + 1).map((d, i) => getModalCoords(i, d.a, metricMeta[activeDetail].max)).join(' ')} />
                    <polyline fill="none" stroke="#eab308" strokeWidth="2.5" opacity="0.8"
                      points={detailChartData.slice(0, currentModalIdx + 1).map((d, i) => getModalCoords(i, d.b, metricMeta[activeDetail].max)).join(' ')} />
                    <polyline fill="none" stroke="#ef4444" strokeWidth="2.5" opacity="0.8"
                      points={detailChartData.slice(0, currentModalIdx + 1).map((d, i) => getModalCoords(i, d.m, metricMeta[activeDetail].max)).join(' ')} />
                    
                    <polyline fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.9"
                      points={detailChartData.slice(0, currentModalIdx + 1).map((d, i) => getModalCoords(i, d.avg, metricMeta[activeDetail].max)).join(' ')} />
                    
                    {/* Live Following Tip Dot with Value Text */}
                    {currentModalPoint && (
                      <g>
                        {(() => {
                          const tipCoords = getModalCoords(currentModalIdx, currentModalPoint.avg, metricMeta[activeDetail].max).split(',');
                          return (
                            <>
                              <circle cx={tipCoords[0]} cy={tipCoords[1]} r="6" fill="#ffffff" stroke="#1e293b" strokeWidth="3" />
                              <text x={tipCoords[0]} y={Number(tipCoords[1]) - 15} fontSize="14" fill="#ffffff" textAnchor="middle" fontWeight="bold">
                                {currentModalPoint.avg.toFixed(1)}{activeDetail === 'startHrDay' ? '시' : metricMeta[activeDetail].unit}
                              </text>
                            </>
                          );
                        })()}
                      </g>
                    )}
                  </svg>
                </div>

                {/* Final Result Popup - 텍스트 표시도 완전히 동일하게 매핑 */}
                <div className={`mt-4 p-4 bg-gradient-to-r from-emerald-900/50 to-blue-900/50 border border-emerald-500/50 rounded-xl flex justify-between items-center transition-all duration-500 ${modalTime >= 7500 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <div className="text-emerald-300 font-bold flex items-center">
                    <CheckCircle className="w-6 h-6 mr-2" /> 최종 도출 수치
                  </div>
                  <div className="text-4xl font-black text-white drop-shadow-lg">
                    {activeDetail === 'startHrDay' 
                      ? `${days[currentData.startDay.avg]}요일 ${currentData.startHr.avg}시` 
                      : activeDetail === 'opHours'
                      ? `${currentData[actualKeyInModal].avg.toFixed(1)}시간`
                      : `${currentData[actualKeyInModal].avg.toFixed(1)}%`}
                  </div>
                </div>

              </div>
            </div>
            
            <div className="h-1.5 w-full bg-slate-800">
              <div className="h-full bg-blue-500 transition-all duration-[50ms]" style={{ width: `${(modalTime / 8000) * 100}%` }}></div>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .animate-fade-in-up { animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}} />
    </div>
  );
};

export default SimulationApp;