import HierarchicalMultiSelect from '@/components/HierarchicalMultiSelect';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react'
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { FiFilter } from "react-icons/fi";
import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

import {
    LineChart, Line,
    BarChart, Bar,
    PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, Legend, LabelList, ResponsiveContainer,
    CartesianGrid,
    Brush
} from 'recharts';


function RdtBsc() {
    const [allData, setAllData] = useState(null);
    const [error, setError] = useState("");

    // States for each filter; all start as []
    const [selectedDivisions, setSelectedDivisions] = useState([]);
    const [selectedDistricts, setSelectedDistricts] = useState([]);
    const [selectedUpazilas, setSelectedUpazilas] = useState([]);
    const [selectedUnions, setSelectedUnions] = useState([]);
    const [selectedWards, setSelectedWards] = useState([]);
    const [selectedvillages, setSelectedvillages] = useState([]);
    const [selectedBracVillages, setSelectedBracVillages] = useState([]);
    const [selectedOrganizations, setSelectedOrganizations] = useState([]);
    // const [selectedDiseases, setSelectedDiseases] = useState([]);
    // const [selectedLabs, setSelectedLabs] = useState([]);
    const [filteredSubmissions, setFilteredSubmissions] = useState([]);
    const [dateRange, setDateRange] = useState([null, null]); // [startDate, endDate]
    const [collapsed, setCollapsed] = useState(true);

    const [showFilter, setShowFilter] = useState(false);
    const [mapFilterState, setMapFilterState] = useState({});


    const norm = (v) => (v ?? "").toString().trim().toLowerCase();
    const arrHas = (arr, v) => Array.isArray(arr) && arr.some(a => norm(a) === norm(v));
    const isAllSelected = (selected, allOptions) => selected.length && allOptions.length && selected.length === allOptions.length;



    console.log("alldata", allData);
    console.log("filteredSubmissions", filteredSubmissions);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = "083c2aefc3556a592d9ee6a9a03773efe12a013c";
                const response = await axios.get(
                    "https://admin2.commicplan.com/api/api/forms/1867/",
                    {
                        headers: { Authorization: `Token ${token}` }
                    }
                );
                setAllData(response.data);
            } catch (err) {
                setError(String(err));
            }
        };
        fetchData();
    }, []);

    const h = useMemo(
        () => (allData ? extractHierarchy(allData.submission || []) : null),
        [allData]
    );

    
    console.log("all data :", h)


    // On data load, select everything by default
    // On data load, select everything by default
    useEffect(() => {
        if (!h) return;
        setSelectedDivisions(h.divisionOptions);
        setSelectedDistricts(h.districtOptions);
        setSelectedUpazilas(h.upazilaOptions);
        setSelectedUnions(h.unionOptions);
        setSelectedWards(h.wardOptions);
        setSelectedBracVillages(h.bracvillageOptions);
        setSelectedvillages(h.villageOptions);
        setSelectedOrganizations(h.organizationOptions);
        // setSelectedDiseases(h.diseaseOptions);
        // setSelectedLabs(h.labOptions);
    }, [h]);


    // Chaining logic
    useEffect(() => {
        if (!h) return;
        // Sync children with selected parents (Division→District)
        setSelectedDistricts(
            autoChainSelect(selectedDivisions, h.divisionToDistricts, selectedDistricts)
        );
    }, [selectedDivisions]);
    useEffect(() => {
        if (!h) return;
        // Sync children with selected parents (District→Upazila)
        setSelectedUpazilas(
            autoChainSelect(selectedDistricts, h.districtToUpazilas, selectedUpazilas)
        );
    }, [selectedDistricts]);
    useEffect(() => {
        if (!h) return;
        setSelectedUnions(
            autoChainSelect(selectedUpazilas, h.upazilaToUnions, selectedUnions)
        );
    }, [selectedUpazilas]);
    useEffect(() => {
        if (!h) return;
        setSelectedWards(
            autoChainSelect(selectedUnions, h.unionToWards, selectedWards)
        );
    }, [selectedUnions]);
    useEffect(() => {
        if (!h) return;
        setSelectedBracVillages(
            autoChainSelect(selectedWards, h.wardTobracvillages, selectedBracVillages)
        );
    }, [selectedWards]);
    useEffect(() => {
        if (!h) return;
        setSelectedvillages(
            autoChainSelect(selectedBracVillages, h.villageTobracvillages, selectedvillages)
        );
    }, [selectedBracVillages]);

    function handleDivisionChange(next) {
        setSelectedDivisions(next);
        setSelectedDistricts(
            districtOptions.filter(dis =>
                next.some(div => h.divisionToDistricts[div]?.includes(dis))
            )
        );
        setSelectedUpazilas([]);
        setSelectedUnions([]);
        setSelectedWards([]);
        setSelectedBracVillages([]);
        setSelectedvillages([]);
        setSelectedOrganizations([]);
        // setSelectedDiseases([]);
    }

    function handleDistrictChange(next) {
        setSelectedDistricts(next);
        setSelectedUpazilas(
            upazilaOptions.filter(upa =>
                next.some(dis => h.districtToUpazilas[dis]?.includes(upa))
            )
        );
        setSelectedUnions([]);
        setSelectedWards([]);
        setSelectedBracVillages([]);
        setSelectedvillages([]);
        setSelectedOrganizations([]);
        // setSelectedDiseases([]);
    }

    function handleUpazilaChange(next) {
        setSelectedUpazilas(next);
        setSelectedUnions(
            unionOptions.filter(uni =>
                next.some(upa => h.upazilaToUnions[upa]?.includes(uni))
            )
        );
        setSelectedWards([]);
        setSelectedBracVillages([]);
        setSelectedvillages([]);
        setSelectedOrganizations([]);
        // setSelectedDiseases([]);
    }

    function handleUnionChange(next) {
        setSelectedUnions(next);
        setSelectedWards(
            wardOptions.filter(war =>
                next.some(uni => h.unionToWards[uni]?.includes(war))
            )
        );
        setSelectedBracVillages([]);
        setSelectedvillages([]);
        setSelectedOrganizations([]);
        // setSelectedDiseases([]);
    }

    function handleWardChange(next) {
        setSelectedWards(next);
        setSelectedBracVillages(
            bracvillageOptions.filter(bracvillage =>
                next.some(war => h.wardTobracvillages[war]?.includes(bracvillage))
            )
        );
        setSelectedvillages([]);
        setSelectedOrganizations([]);
        // setSelectedDiseases([]);
    }

    function handlebracvillageChange(next) {
        setSelectedBracVillages(next);
        setSelectedvillages(
           villageOptions.filter(v =>
           next.some(bv => h.villageTobracvillages[bv]?.includes(v))
        )
    );
//   setSelectedOrganizations([]);
        // org/disease always filtered by visible rows
        setSelectedOrganizations([]);
        // setSelectedDiseases([]);
    }

    function handlevillageChange(next) {
        
        setSelectedvillages(next);
        // org/disease always filtered by visible rows
        setSelectedOrganizations([]);
        // setSelectedDiseases([]);
    }
    
    function handleOrganizationChange(next) {
        setSelectedOrganizations(next);
    }

    // function handleDiseaseChange(next) {
    //     setSelectedDiseases(next);
    // }

    // function handleLabChange(next) {
    //     setSelectedLabs(next);
    // }

    // Parents as a mapping for convenience
    const filterState = {
        division: selectedDivisions,
        district: selectedDistricts,
        upazila: selectedUpazilas,
        union: selectedUnions,
        ward: selectedWards,
        village: selectedvillages,
        brac_village: selectedBracVillages,
    };

    const divisionOptions = useMemo(() =>
        h && h.allRows ? filterOptions(h.allRows, ['division'], filterState) : [],
        [h, filterState]
    );

    const districtOptions = useMemo(() =>
        h && h.allRows ? filterOptions(h.allRows, ['division', 'district'], filterState) : [],
        [h, filterState]
    );

    const upazilaOptions = useMemo(() =>
        h && h.allRows ? filterOptions(h.allRows, ['division', 'district', 'upazila'], filterState) : [],
        [h, filterState]
    );

    const unionOptions = useMemo(() =>
        h && h.allRows ? filterOptions(h.allRows, ['division', 'district', 'upazila', 'union'], filterState) : [],
        [h, filterState]
    );

    const wardOptions = useMemo(() =>
        h && h.allRows ? filterOptions(h.allRows, ['division', 'district', 'upazila', 'union', 'ward'], filterState) : [],
        [h, filterState]
    );

    const bracvillageOptions = useMemo(() => 
        h && h.allRows ? filterOptions(h.allRows, ['division','district','upazila','union','ward','brac_village'], filterState) : [],
        [h, filterState]
    );

    const villageOptions = useMemo(() =>
        h && h.allRows ? filterOptions(h.allRows, ['division','district','upazila','union','ward','brac_village','village'], filterState) : [],
        [h, filterState]
    );


   const filteredRows = useMemo(() =>
        h && h.allRows
            ? h.allRows.filter(row =>
                (!selectedDivisions.length || isAllSelected(selectedDivisions, h.divisionOptions) || arrHas(selectedDivisions, row.division)) &&
                (!selectedDistricts.length || isAllSelected(selectedDistricts, h.districtOptions) || arrHas(selectedDistricts, row.district)) &&
                (!selectedUpazilas.length  || isAllSelected(selectedUpazilas, h.upazilaOptions)  || arrHas(selectedUpazilas, row.upazila)) &&
                (!selectedUnions.length    || isAllSelected(selectedUnions, h.unionOptions)      || arrHas(selectedUnions, row.union)) &&
                (!selectedWards.length || isAllSelected(selectedWards, h.wardOptions) || arrHas(selectedWards, row.ward)) &&
                (!selectedBracVillages.length || isAllSelected(selectedBracVillages, h.bracvillageOptions) || arrHas(selectedBracVillages, row.brac_village)) &&
                (!selectedvillages.length || isAllSelected(selectedvillages, h.villageOptions) || arrHas(selectedvillages, row.village))

            )
            : [],
        [
            h,
            selectedDivisions,
            selectedDistricts,
            selectedUpazilas,
            selectedUnions,
            selectedWards,
            selectedBracVillages,
            selectedvillages
        ]
    );


    const organizationOptions = useMemo(() =>
        filteredRows.length > 0
            ? getUnique(filteredRows.map(row => row.organization).filter(Boolean))
            : [],
        [filteredRows]
    );

    

    // const diseaseOptions = useMemo(() =>
    //     filteredRows.length > 0
    //         ? getUnique(filteredRows.flatMap(row => row.disease).filter(Boolean))
    //         : [],
    //     [filteredRows]
    // );

    useEffect(() => {
        // Only auto-select if the options list actually changed (new options)
        setSelectedOrganizations(prev =>
            organizationOptions.length && !prev.length
                ? organizationOptions
                : prev.filter(v => organizationOptions.includes(v))
        );
    }, [organizationOptions]);

    // Auto-select all visible disease options
    // useEffect(() => {
    //     setSelectedDiseases(prev =>
    //         diseaseOptions.length && !prev.length
    //             ? diseaseOptions
    //             : prev.filter(v => diseaseOptions.includes(v))
    //     );
    // }, [diseaseOptions]);

    // console.log("selected diease 😒😒😍", selectedDiseases)

    useEffect(() => {
        if (!h || !h.allRows) {
            setFilteredSubmissions([]);
            return;
        }
        console.log("debugg", selectedWards, selectedBracVillages, selectedvillages, selectedOrganizations, h.allRows )
        const [start, end] = dateRange;
        const norm = (v) => (v || '').trim().toLowerCase();
        let filtered = h.allRows.filter(row =>
            (!selectedDivisions.length || isAllSelected(selectedDivisions, h.divisionOptions) || arrHas(selectedDivisions, row.division)) &&
            (!selectedDistricts.length || isAllSelected(selectedDistricts, h.districtOptions) || arrHas(selectedDistricts, row.district)) &&
            (!selectedUpazilas.length  || isAllSelected(selectedUpazilas, h.upazilaOptions)  || arrHas(selectedUpazilas, row.upazila)) &&
            (!selectedUnions.length    || isAllSelected(selectedUnions, h.unionOptions)      || arrHas(selectedUnions, row.union)) &&
            (!selectedWards.length || isAllSelected(selectedWards, h.wardOptions) || arrHas(selectedWards, row.ward)) &&
            (!selectedBracVillages.length || isAllSelected(selectedBracVillages, h.bracvillageOptions) || arrHas(selectedBracVillages, row.brac_village)) &&
            (!selectedvillages.length || isAllSelected(selectedvillages, h.villageOptions) || arrHas(selectedvillages, row.village)) &&
            (!selectedOrganizations.length || selectedOrganizations.some(o => norm(o) === norm(row.organization))) &&
            (!start || row.day >= start) &&
            (!end   || row.day <= end)
        );


        console.log("ssssssssssssssssss🙌🙌", filtered)

        // if (selectedDiseases.length > 0) {
        //     filtered = filtered.filter(row => {
        //         if (Array.isArray(row.disease)) {
        //             return row.disease.some(d =>
        //                 selectedDiseases.some(s =>
        //                     d && s && d.trim().toLowerCase() === s.trim().toLowerCase()
        //                 )
        //             );
        //         } else {
        //             return selectedDiseases.some(s =>
        //                 row.disease && s && row.disease.trim().toLowerCase() === s.trim().toLowerCase()
        //             );
        //         }
        //     });
        // }
        setFilteredSubmissions(filtered);
    }, [
        h,
        selectedDivisions,
        selectedDistricts,
        selectedUpazilas,
        selectedUnions,
        selectedWards,
        selectedBracVillages,
        selectedvillages,
        selectedOrganizations,
        // selectedDiseases,
        dateRange
    ]);



    const allDays = useMemo(() => (
        h && h.allRows
            ? getUnique(h.allRows.map(x => x.day).filter(Boolean)).sort()
            : []
    ), [h]);

    const minDay = allDays[0];
    const maxDay = allDays[allDays.length - 1];

    // Enforce clamping on setDateRange
    const clampDate = (d, minD, maxD) =>
        d < minD ? minD : d > maxD ? maxD : d;

    function handleDateRangeChange([from, to]) {
        if (!minDay || !maxDay) return;
        // Clamp within min/max
        const clampedFrom = clampDate(from, minDay, maxDay);
        const clampedTo = clampDate(to, minDay, maxDay);
        setDateRange([clampedFrom, clampedTo]);
    }

    // On initial data load, select full range
    useEffect(() => {
        if (minDay && maxDay) setDateRange([minDay, maxDay]);
    }, [minDay, maxDay]);

    // --- calculateMetrics1867(submissions) ---
        // submissions MUST be an array of flattened rows (the rows inside h.allRows or filteredSubmissions)
  function calculateMetrics(submissions) {
  if (!Array.isArray(submissions) || submissions.length === 0) return {};

  // Helper: convert {key: count} → [{name,value}]
  const countBy = (arr, key) => {
    const map = {};
    arr.forEach((x) => {
      const val = (x[key] || "").toString().trim();
      if (val) map[val] = (map[val] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  };

  // --- Submissions over time (for LineChart)
  const submissionsPerDay = {};
  submissions.forEach((x) => {
    if (!x.day) return;
    submissionsPerDay[x.day] = (submissionsPerDay[x.day] || 0) + 1;
  });
  const submissionsOverTime = Object.keys(submissionsPerDay)
    .sort()
    .map((day) => ({ name: day, value: submissionsPerDay[day] }));

  // --- Positive Rate Pie (from types_of_diseases_for_rdt or positive_status)
  let pos = 0, neg = 0, other = 0;
  submissions.forEach((x) => {
    const status = (x.positive_status || "").toLowerCase();
    if (status === "positive") pos++;
    else if (status === "negative") neg++;
    else other++;
  });
  const positiveRatePie = [
    { name: "Positive", value: pos },
    { name: "Negative", value: neg },
  ];
  const positivePercent = Math.round((100 * pos) / ((pos + neg) || 1));

  // --- Case Ratio Pie (species types)
  const caseRatioPie = countBy(submissions, "type_of_species");

  // --- Severity Pie (if available)
//   const severityPie = countBy(submissions, "severe_malaria");
//   const severeCount =
//     severityPie.find((d) => d.name.toLowerCase().includes("severe"))?.value || 0;
//   const severePercent = Math.round(
//     (100 * severeCount) / ((severityPie.reduce((a, b) => a + b.value, 0)) || 1)
//   );

  // --- Pregnant Pie
  const pregnantPie = countBy(submissions, "pregnent");

  // --- Source of Infection Bar
  const sourceInfectionBar = countBy(submissions, "source_of_infection");

  // --- Case Identification Bar
  const caseIdentificationBar = countBy(submissions, "case_identification");

  // --- Treatment Provided Bar
  const treatmentProvidedBar = [];
  const tMap = {};
  submissions.forEach((x) => {
    [x.treatment1, x.treatment2]
      .filter(Boolean)
      .forEach((t) => {
        const name = String(t).replace(/_/g, " ").trim();
        if (name) tMap[name] = (tMap[name] || 0) + 1;
      });
  });
  for (const [name, value] of Object.entries(tMap)) {
    treatmentProvidedBar.push({ name, value });
  }

  // --- Age-Gender Distribution
  const ageGenderBar = countBy(submissions, "sex");

  // --- Referral Rate Pie
  let refYes = 0, refNo = 0;
  submissions.forEach((x) => {
    if ((x.the_patient_is_referred || "").toLowerCase() === "yes") refYes++;
    else refNo++;
  });
  const referralRatePie = [
    { name: "Referred", value: refYes },
    { name: "Not Referred", value: refNo },
  ];
  const referralPercent = Math.round((100 * refYes) / ((refYes + refNo) || 1));

  // --- Referred Site Bar
  const referredSiteBar = countBy(submissions, "where_is_it_referred_to");

  // --- Occupation Distribution
  const occupationBar = countBy(submissions, "occupation");

  // --- Ethnicity Distribution
  const ethnicityBar = countBy(submissions, "racegroup");

  // --- Travel History (Pie + Bar)
  const travelHistoryPie = countBy(submissions, "travel_history");
  const travelHistoryBar = countBy(submissions, "travel_country");

  // --- Household malaria (Pie + Times Bar)
  const hhPastYearPie = countBy(
    submissions,
    "have_you_or_any_member_of_your_household_had_malaria_in_the_past_year"
  );
  const hhTimesBar = countBy(submissions, "how_many_times");

  // --- Delay between fever onset and treatment
  const delayTreatmentBar = (() => {
    const result = [];
    submissions.forEach((x) => {
      const fever = new Date(x.date_of_onset_fever);
      const treatment = new Date(x.date_of_initiation_of_treatment);
      if (!isNaN(fever) && !isNaN(treatment)) {
        const diffDays = Math.round((treatment - fever) / (1000 * 60 * 60 * 24));
        const label =
          diffDays <= 0
            ? "Same day"
            : diffDays === 1
            ? "1 day"
            : diffDays <= 3
            ? "2–3 days"
            : "4+ days";
        const found = result.find((r) => r.name === label);
        if (found) found.value++;
        else result.push({ name: label, value: 1 });
      }
    });
    return result;
  })();

  // --- Map Markers
  const mapMarkers = submissions
    .filter(
      (x) =>
        typeof x.latitude === "number" &&
        typeof x.longitude === "number" &&
        !isNaN(x.latitude) &&
        !isNaN(x.longitude)
    )
    .map((x) => ({
      lat: x.latitude,
      lng: x.longitude,
      info: x,
    }));

  return {
    totalSubmissions: submissions.length,
    submissionsOverTime,

    // Positive & Case info
    positiveRatePie,
    positivePercent,
    caseRatioPie,
    // severityPie,
    // severePercent,
    pregnantPie,

    // Bar metrics
    sourceInfectionBar,
    caseIdentificationBar,
    treatmentProvidedBar,
    ageGenderBar,

    // Referral metrics
    referralRatePie,
    referralPercent,
    referredSiteBar,

    // Demographics
    occupationBar,
    ethnicityBar,

    // Travel & household
    travelHistoryPie,
    travelHistoryBar,
    hhPastYearPie,
    hhTimesBar,

    // Delay & map
    delayTreatmentBar,
    mapMarkers,
  };
}

    const metrics = useMemo(() => calculateMetrics(filteredSubmissions), [filteredSubmissions]);
    console.log("metrics", metrics);

    const points = useMemo(
        () => filteredSubmissions
            .filter(x => x.latitude && x.longitude)
            .map(x => ({
                ...x,
                lat: x.latitude,
                lng: x.longitude,
            })),
        [filteredSubmissions]
    );


    const mapPoints = filteredSubmissions
        .filter(row => isValidLatLng(row.latitude, row.longitude));

    // useEffect(() => {
    //     setSelectedDiseases(prev => {
    //         // if there was no previous selection, select all options
    //         if (!prev.length && diseaseOptions.length) return diseaseOptions;
    //         // otherwise, add any new options that appeared
    //         const addedOptions = diseaseOptions.filter(option => !prev.includes(option));
    //         return [...prev, ...addedOptions];
    //     });
    // }, [diseaseOptions]);


    const filterFields = [
        { key: "organization", label: "Organization" },
        { key: "bednetusepracticeduringsleep", label: "Bednet Use" },
        { key: "didanydisasteroccurinlast7days", label: "Disaster Last 7 Days" },
        { key: "presenceofmosquitolarvae", label: "Mosquito Larvae" },
        { key: "sex", label: "Gender" },
        { key: "pregnent", label: "Pregnant" },
        { key: "type_of_species", label: "Species" } 
    ];

    // ---- Filtered Map Points ----
    const filteredMapPoints = useMemo(() =>
        filteredSubmissions.filter(row =>
            filterFields.every(
                f =>
                    !mapFilterState[f.key] ||
                    (Array.isArray(row[f.key])
                        ? row[f.key].includes(mapFilterState[f.key])
                        : row[f.key] === mapFilterState[f.key])
            ) &&
            isValidLatLng(row.latitude, row.longitude)
        ),
        [filteredSubmissions, mapFilterState, filterFields]
    );

    // console.log("filteredMapPoints", filteredMapPoints);

    // Helper function
    function isValidLatLng(lat, lng) {
        return (
            typeof lat === "number" &&
            typeof lng === "number" &&
            !isNaN(lat) && !isNaN(lng) &&
            isFinite(lat) && isFinite(lng) &&
            Math.abs(lat) <= 90 && Math.abs(lng) <= 180
        );
    }



    // const organizationOptions = useMemo(
    //     () => getUnique(filteredSubmissions.map(sub => sub.organization).filter(Boolean)),
    //     [filteredSubmissions]
    // );

    // const diseaseOptions = useMemo(
    //     () => getUnique(filteredSubmissions.flatMap(sub => sub.disease).filter(Boolean)),
    //     [filteredSubmissions]
    // );


    // if (!h) return <div>Loading...</div>;
    if (!h || !h.allRows) {
        return <div>Loading...</div>;
    }
    if (error) return <div>{error}</div>;

    // console.log("Filtered data count:", filteredSubmissions.length);

    return (
        <div className='md:mx-2 mb-8'>
            <div className="bg-blue-50 p-4 rounded-xl shadow-md mb-6">
                <button
                    type="button"
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label={collapsed ? "Expand" : "Collapse"}
                    onClick={() => setCollapsed(prev => !prev)}
                >
                    {collapsed ? (
                        // Chevron down
                        <svg
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="transition-transform"
                        >
                            <path d="M4 6l4 4 4-4" />
                        </svg>
                    ) : (
                        // Chevron up
                        <svg
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="transition-transform"
                        >
                            <path d="M4 10l4-4 4 4" />
                        </svg>
                    )}
                    <span>{collapsed ? "Show" : "Hide"} filters</span>
                </button>

                {!collapsed && (<div className="grid grid-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                    {/* Date Range Picker (static for now) */}


                    <div className="flex flex-col min-w-[220px] gap-2">
                        <p className="font-medium text-gray-700 text-[14px]">Date range</p>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-[280px] justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange[0] && dateRange[1] ? (
                                        <>
                                            {format(new Date(dateRange[0]), "LLL dd, y")} –{" "}
                                            {format(new Date(dateRange[1]), "LLL dd, y")}
                                        </>
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>

                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="range"
                                    numberOfMonths={2}
                                    selected={{
                                        from: dateRange[0] ? new Date(dateRange[0]) : undefined,
                                        to: dateRange[1] ? new Date(dateRange[1]) : undefined,
                                    }}
                                    min={new Date(minDay)}
                                    max={new Date(maxDay)}
                                    onSelect={(range) => {
                                        if (!range) return;
                                        handleDateRangeChange([
                                            range.from
                                                ? range.from.toISOString().split("T")[0]
                                                : minDay,
                                            range.to
                                                ? range.to.toISOString().split("T")[0]
                                                : maxDay,
                                        ]);
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <HierarchicalMultiSelect
                        label="Division"
                        options={divisionOptions}
                        selected={selectedDivisions}
                        setSelected={handleDivisionChange}
                    />

                    <HierarchicalMultiSelect
                        label="District"
                        options={districtOptions}
                        selected={selectedDistricts}
                        setSelected={handleDistrictChange}
                        disabled={!selectedDivisions.length}
                    />

                    <HierarchicalMultiSelect
                        label="Upazila"
                        options={upazilaOptions}
                        selected={selectedUpazilas}
                        setSelected={handleUpazilaChange}
                        disabled={!selectedDistricts.length}
                    />

                    <HierarchicalMultiSelect
                        label="Union"
                        options={unionOptions}
                        selected={selectedUnions}
                        setSelected={handleUnionChange}
                        disabled={!selectedUpazilas.length}
                    />

                    <HierarchicalMultiSelect
                        label="Ward"
                        options={wardOptions}
                        selected={selectedWards}
                        setSelected={handleWardChange}
                        disabled={!selectedUnions.length}
                    />

                    <HierarchicalMultiSelect
                      label="BRAC Village"
                      options={bracvillageOptions}
                      selected={selectedBracVillages}
                      setSelected={handlebracvillageChange}
                      disabled={!selectedWards.length}
                    />

                    <HierarchicalMultiSelect
                        label="Village (village)"
                        options={villageOptions}
                        selected={selectedvillages}
                        setSelected={handlevillageChange}
                        disabled={!selectedWards.length}
                    />

                    {/*<HierarchicalMultiSelect
                        label="Disease"
                        options={diseaseOptions}
                        selected={selectedDiseases}
                        setSelected={handleDiseaseChange}
                        disabled={!selectedvillages.length}
                    />*/}

                    {/* <HierarchicalMultiSelect
                        label="Lab"
                        // options={labOptions}
                        selected={selectedLabs}
                        setSelected={handleLabChange}
                        disabled={!selectedvillages.length}
                    />  */}

                    <HierarchicalMultiSelect
                        label="Organization"
                        options={organizationOptions}
                        selected={selectedOrganizations}
                        setSelected={handleOrganizationChange}
                        disabled={!selectedvillages.length}
                    />

                    {/*<HierarchicalMultiSelect
                        label="Site Type"
                        options={diseaseOptions}
                        selected={selectedDiseases}
                        setSelected={handleDiseaseChange}
                        disabled={!selectedvillages.length}
                    />*/}
 

                </div>)}
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[200px]">

                    <LineCard
                        title="Submissions Over Time"
                        data={metrics.submissionsOverTime || []}
                        stat={metrics.totalSubmissions || 0}
                    />

                    <PieCard
                        title="Positive Rate"
                        data={metrics.positiveRatePie || []}
                        colors={["#FF6361", "#005fbe", "#d9534f"]}
                        stat={`${metrics.positivePercent || 0}%`}
                    />

                    <PieCard
                        title="Case Ratio"
                        data={metrics.caseRatioPie || []}
                        colors={["#005fbe", "#FF6361", "#FFB300"]}
                    />

                    {/* <MultiPieCard
                        title="Severity"
                        data={metrics.severityPie || []}
                        colors={["#005fbe", "#FF6361"]}
                        stat={`${metrics.severePercent || 0}%`}
                    /> */}

                    <PieCard
                        title="Pregnant"
                        data={metrics.pregnantPie || []}
                        colors={["#005fbe", "#FF6361"]}
                    />

                    {/* Map Section */}
                    <div className="row-span-2 md:col-span-2 lg:col-span-2">
                        <DashboardCard title="Map">
                        <div className="relative w-full h-full min-h-[350px]">
                            {/* Filter Button */}
                            <button
                            onClick={() => setShowFilter(prev => !prev)}
                            className="absolute bottom-4 left-4 z-[1200] bg-white border border-gray-200 rounded-lg px-3 py-1.5 
                            text-xs font-medium shadow-md hover:shadow-lg transition flex items-center gap-1"
                            >
                            <FiFilter className="text-gray-600 text-sm" />
                            Filter Map
                            </button>

                            {/* Map */}
                            <PatientMap points={filteredMapPoints} />

                            {/* Optional filter modal */}
                            {showFilter && (
                            <div className="absolute bottom-16 left-6 z-[1500] bg-white rounded-lg shadow-xl 
                            p-3 w-[200px] max-h-[60%] overflow-y-auto border border-gray-100">
                                <h3 className="flex items-center gap-1 font-medium text-xs text-gray-700 mb-2">
                                <FiFilter className="text-gray-500 text-sm" />
                                Questions Filter
                                </h3>
                                {/* Add filter UI here if needed */}
                                <div className="flex justify-end mt-2">
                                <button
                                    onClick={() => setShowFilter(false)}
                                    className="bg-red-500 hover:bg-red-600 text-white text-[11px] font-medium 
                                    px-2 py-1 rounded-md transition"
                                >
                                    Close
                                </button>
                                </div>
                            </div>
                            )}
                        </div>
                        </DashboardCard>
                    </div>

                    <HorizontalBarCard
                        title="Source of Infection"
                        data={metrics.sourceInfectionBar || []}
                        colors={["#FF6361", "#3296FA", "#60B76D"]}
                        stat={(metrics.sourceInfectionBar || []).reduce((s, d) => s + d.value, 0)}
                    />

                    <HorizontalBarCard
                        title="Case Identification"
                        data={metrics.caseIdentificationBar || []}
                        colors={["#FF6361", "#3296FA", "#60B76D"]}
                        stat={(metrics.caseIdentificationBar || []).reduce((s, d) => s + d.value, 0)}
                    />

                    <div className='md:col-span-2'>
                        <HorizontalBarCard
                            title="Treatment Provided"
                            data={metrics.treatmentProvidedBar || []}
                            colors={["#FF6361", "#3296FA", "#60B76D"]}
                            stat={(metrics.treatmentProvidedBar || []).reduce((s, d) => s + d.value, 0)}
                        />
                    </div>

                    <PieCard
                        title="Age-Gender Distribution"
                        data={metrics.ageGenderBar || []}
                        colors={["#005fbe", "#FF6361", "#FFB300"]}
                        stat={(metrics.ageGenderBar || []).reduce((s, d) => s + d.value, 0)}
                    />

                    <PieCard
                        title="Referral Rate"
                        data={metrics.referralRatePie || []}
                        colors={["#FF6361", "#005fbe"]}
                        stat={`${metrics.referralPercent || 0}%`}
                    />

                    <div className="md:col-span-2">
                        <HorizontalBarCard
                        title="Referred Site"
                        data={metrics.referredSiteBar || []}
                        colors={["#3296FA", "#60B76D", "#FFB300", "#FF6361", "#9B59B6"]}
                        stat={(metrics.referredSiteBar || []).reduce((s, d) => s + d.value, 0)}
                        />
                    </div>

                    <HorizontalBarCard
                        title="Occupation Distribution"
                        data={metrics.occupationBar || []}
                        colors={["#FF6361", "#3296FA", "#60B76D"]}
                        stat={(metrics.occupationBar || []).reduce((s, d) => s + d.value, 0)}
                    />

                    <HorizontalBarCard
                        title="Ethnicity Distribution"
                        data={metrics.ethnicityBar || []}
                        colors={["#FF6361", "#3296FA", "#60B76D"]}
                        stat={(metrics.ethnicityBar || []).reduce((s, d) => s + d.value, 0)}
                    />

                    <PieCard
                        title="Travel History"
                        data={metrics.travelHistoryPie || []}
                        colors={["#FF6361", "#005fbe"]}
                        stat={`${(metrics.travelHistoryPie || []).reduce((s, d) => s + d.value, 0)} total`}
                    />

                    <HorizontalBarCard
                        title="Travel History"
                        data={metrics.travelHistoryBar || []}
                        colors={["#FF6361", "#3296FA", "#60B76D"]}
                        stat={(metrics.travelHistoryBar || []).reduce((s, d) => s + d.value, 0)}
                    />

                    <PieCard
                        title="Household Had Malaria in Past Year"
                        data={metrics.hhPastYearPie || []}
                        colors={["#FF6361", "#005fbe"]}
                        stat={`${(metrics.hhPastYearPie || []).reduce((s, d) => s + d.value, 0)} total`}
                    />

                    <HorizontalBarCard
                        title="Malaria Occurence/frequency per Household"
                        data={metrics.hhTimesBar || []}
                        colors={["#FF6361", "#3296FA", "#60B76D"]}
                        stat={(metrics.hhTimesBar || []).reduce((s, d) => s + d.value, 0)}
                    />

                    <HorizontalBarCard
                        title="Delay Between Onset Fever and Treatment"
                        data={metrics.delayTreatmentBar || []}
                        colors={["#FF6361", "#3296FA", "#60B76D", "#9B59B6"]}
                        stat={(metrics.delayTreatmentBar || []).reduce((s, d) => s + d.value, 0)}
                    />
            </div>
        </div>
    )
}

export default RdtBsc

// const DashboardCard = ({ title, children, barColor = "#005fbe" }) => (
//     <div className="rounded-md shadow border border-blue-800 flex flex-col w-full h-full bg-white overflow-hidden">
//         {/* Colored Title Bar */}
//         <div
//             style={{ background: barColor }}
//             className="px-3 py-2"
//         >
//             <h3 className="text-base font-bold text-white tracking-tight">
//                 {title}
//             </h3>
//         </div>
//         {/* Chart/Content village: fills all, NO extra padding or margin */}
//         <div className="flex-1 flex items-center justify-center w-full h-full">
//             <div className="w-full h-full flex items-center justify-center">
//                 {children}
//             </div>
//         </div>
//     </div>
// );



    function autoChainSelect(valueList, mapping, allSelected) {
        let out = [];
        valueList.forEach(val => {
            if (mapping[val]) out.push(...mapping[val]);
        });
        return getUnique([...allSelected, ...out]);
    }


    // Chained option generator
    function filterOptions(rows, keys, parentSelected) {
        const norm = (v) => (v ?? "").toString().trim().toLowerCase();
        return getUnique(
            rows
            .filter(row =>
                keys.slice(0, -1).every(k =>
                !parentSelected[k]?.length || parentSelected[k].some(pv => norm(pv) === norm(row[k]))
                )
            )
            .map(row => row[keys[keys.length - 1]])
            .filter(Boolean)
        );
    }


function autoChainDeselect(deselected, mapping, childSelected) {
    // Remove any child keys that are children of *any* deselected parent
    const toRemove = deselected.flatMap(val => mapping[val] || []);
    return childSelected.filter(x => !toRemove.includes(x));
}

function getUnique(arr) {
    return Array.from(new Set(arr)).filter(Boolean);
}

// --- flattenSubmission(x) ---
// Flattens a single submission object (mobile-style or Enketo web nested)
 function flattenSubmission(x) {
  if (!x || !x.data) return null;
  const d = x.data;

  // --- Subgroups (safe fallbacks for missing groups)
  const collector = d.data_collector_s_information || {};
  const patient = d.patient_information || {};
  const caseRecord = d.malaria_case_record_form || {};
  const caseDetails = d.malaria_case_details || {};
  const travel = d.travel_history || {};
//   const origin = d.patient_s_country_of_origin || {};
  const report = d.reporting_site_details || {};
  
  // --- Parse coordinates from caseDetails.position_of_the_patient_coordinates_of_the_patient
  let latitude = null, longitude = null;
  if (caseDetails.position_of_the_patient_coordinates_of_the_patient) {
      const coords = String(caseDetails.position_of_the_patient_coordinates_of_the_patient).trim().split(/\s+/);
      if (coords.length >= 2) {
          latitude = Number(coords[0]);
          longitude = Number(coords[1]);
        }
    }
    
    // --- Flattened unified structure
    return {
        // --- Meta
        id: x._id || d._id || '',
        submitted_by: x.meta?.submitted_by || '',
        submission_type: x.meta?.submission_type || '',
    date: d.end ? String(d.end).slice(0, 10) : '',
    day: d.end ? String(d.end).slice(0, 10) : '',
    start: d.start || '',
    end: d.end || '',
    
    
    // --- Reporting Site (admin)
    division: report.division || '',
    district: report.district || '',
    upazila: report.upazila || '',
    union: report.union || '',
    ward: report.ward || '',
    brac_village: report.brac_village || '',
    village: report.village || '',
    // country_origin: origin.patients_country_of_origin || '',

    // --- Patient Info
    // patient_name: patient.patient_name || '',
    age: patient.age ? String(patient.age).replace(/_$/, '') : '',
    sex: patient.gander || patient.gender || '',
    pregnent: patient.pregnent || '',
    racegroup: patient.racegroup || '',
    occupation: patient.occupation || '',
    // guardians_name: patient.guardians_name || '',
    // nationality: patient.nationality || '',
    // nid_id: patient.nid_id || '',
    // occupation: patient.occupation || '',
    // racegroup: patient.racegroup || '',
    // weight: patient.weight || '',
    // phone_number: patient.phone_number || '',
    // user_identification: patient.user_identification || '',

    // --- Case Record Info
    type_of_test: caseRecord.type_of_test || '',
    type_of_test_facility: caseRecord.type_of_test_facility || '',
    types_of_diseases_for_rdt: caseRecord.types_of_diseases_for_rdt || '',

    // --- Case Details
    case_identification: caseDetails.case_identification || '',
    acd_identification: caseDetails.acd_identification || '',
    case_classification: caseDetails.case_classification || '',
    type_of_species: caseDetails.type_of_species || '',
    date_of_onset_fever: caseDetails.date_of_onset_fever || '',
    date_of_first_test: caseDetails.date_of_first_test || '',
    date_of_initiation_of_treatment: caseDetails.date_of_initiation_of_treatment || '',
    treatment1: caseDetails.treatment1 || '',
    treatment2: caseDetails.treatment2 || '',
    the_patient_is_referred: caseDetails.the_patient_is_referred || '',
    where_is_it_referred_to: caseDetails.where_is_it_referred_to || '',
    source_of_infection: caseDetails.case_classification || '',
    general_hospital: caseDetails.general_hospital || '',
    have_you_or_any_member_of_your_household_had_malaria_in_the_past_year:
      caseDetails.have_you_or_any_member_of_your_household_had_malaria_in_the_past_year || '',
    how_many_times: caseDetails.how_many_times || '',
    used_llin_insecticide_mosquito_repellent_in_last_15_days:
      caseDetails.used_llin_insecticide_mosquito_repellent_in_last_15_days || '',
    the_total_number_of_llins_limited_insecticides_in_your_house:
      caseDetails.the_total_number_of_llins_limited_insecticides_in_your_house || '',
    latitude,
    longitude,

    // --- Travel History
    travel_history: travel.do_the_patient_have_any_travel_history || '',
    travel_country: travel["if_international__specify_the_last_country_visited."] || '',

    // --- Data Collector
    // collector_name: collector.employee_name || '',
    collector_designation: collector.designation_of_data_collector || '',
    organization: collector.name_of_the_organization || '',

    // --- Derived for chart use
    positive_status: (caseRecord.types_of_diseases_for_rdt || '').toLowerCase().includes("positive")
      ? "positive"
      : ((caseRecord.types_of_diseases_for_rdt || '').toLowerCase().includes("negative")
        ? "negative"
        : "other"),
  };
}



    


// --- extractHierarchy(submissions) ---
// Accepts raw submissions[] (each entry like { data: { ... }, ... })
// Returns the same shape your UI expects (options + maps + allRows)
function extractHierarchy(submissions) {
  // helpers
  const pushUnique = (arr, v) => { if (v && !arr.includes(v)) arr.push(v); };
  const ensure = (obj, k) => (obj[k] ??= []);
  const uniqObjArrays = (m) =>
    Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Array.from(new Set(v))]));

  // option buckets
  const divisions = [];
  const allDistricts = [];
  const allUpazilas = [];
  const allUnions = [];
  const allWards = [];
  const allBracVillages = [];
  const allVillages = [];
  const organizations = [];
//   const labs = []; // keep for future if you add lab_name

  // parent→child maps
  const divisionToDistricts = {};
  const districtToUpazilas = {};
  const upazilaToUnions = {};
  const unionToWards = {};
  const wardToBracVillages = {};
  const bracVillageToVillages = {};

  const allRows = [];

  for (const x of submissions || []) {
    const row = flattenSubmission(x);
    if (!row) continue;

    // IMPORTANT: use the correct key name
    const {
      division, district, upazila, union, ward,
      village, brac_village, organization, lab_name
    } = row;

    // options
    if (division) pushUnique(divisions, division);
    if (district) pushUnique(allDistricts, district);
    if (upazila) pushUnique(allUpazilas, upazila);
    if (union) pushUnique(allUnions, union);
    if (ward) pushUnique(allWards, ward);
    if (brac_village) pushUnique(allBracVillages, brac_village);
    if (village) pushUnique(allVillages, village);
    if (organization) pushUnique(organizations, organization);
    // if (lab_name) pushUnique(labs, lab_name);

    // maps (always ensure the array before push)
    if (division && district) pushUnique(ensure(divisionToDistricts, division), district);
    if (district && upazila) pushUnique(ensure(districtToUpazilas, district), upazila);
    if (upazila && union) pushUnique(ensure(upazilaToUnions, upazila), union);
    if (union && ward) pushUnique(ensure(unionToWards, union), ward);

    // ward → brac_villages
    if (ward && brac_village) pushUnique(ensure(wardToBracVillages, ward), brac_village);

    // brac_village → villages
    if (brac_village && village) pushUnique(ensure(bracVillageToVillages, brac_village), village);

    allRows.push(row);
  }

  return {
    divisionOptions: divisions,
    districtOptions: allDistricts,
    upazilaOptions: allUpazilas,
    unionOptions: allUnions,
    wardOptions: allWards,
    bracvillageOptions: allBracVillages,
    villageOptions: allVillages,
    organizationOptions: organizations,
    // labOptions: labs,
    divisionToDistricts: uniqObjArrays(divisionToDistricts),
    districtToUpazilas: uniqObjArrays(districtToUpazilas),
    upazilaToUnions: uniqObjArrays(upazilaToUnions),
    unionToWards: uniqObjArrays(unionToWards),
    wardTobracvillages: uniqObjArrays(wardToBracVillages),
    villageTobracvillages: uniqObjArrays(bracVillageToVillages),
    allRows,
  };
}



// function PieCard({ title, data, colors }) {
//     return (
//         <DashboardCard title={title}>
//             <PieChart width={120} height={120}>
//                 <Pie
//                     data={data}
//                     cx={60} cy={60} innerRadius={35} outerRadius={50}
//                     dataKey="value"
//                     label={({ name, value }) => `${name} ${value}`}
//                 >
//                     {data.map((entry, index) =>
//                         <Cell key={index} fill={colors[index % colors.length]} />
//                     )}
//                 </Pie>
//                 <Tooltip />
//             </PieChart>
//         </DashboardCard>
//     );
// }


        const DashboardCard = ({ title, stat, children, barColor = "#005fbe" }) => (
            <div className="rounded-md shadow border border-blue-800 flex flex-col w-full h-full bg-white overflow-hidden">
                {/* Colored Title Bar */}
                <div
                    style={{ background: barColor }}
                    className="px-3 py-2 flex items-center justify-between"
                >
                    <h3 className="text-base font-bold text-white tracking-tight">
                        {title}
                    </h3>
                    {stat && (
                        <span className="text-sm font-semibold text-white opacity-90">
                            {stat}
                        </span>
                    )}
                </div>

                {/* Chart/Content village */}
                <div className="flex-1 flex items-center justify-center w-full h-full min-h-[150px]">
                    <div className="w-full h-full flex items-center justify-center">
                        {children}
                    </div>
                </div>
            </div>
        );



        function PieCard({ title, data, colors, stat }) {
            return (
                <DashboardCard title={title} stat={stat}>
                    <div style={{ width: "100%", height: "130%", padding: 20 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                            data={data}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={0}
                            outerRadius="45%"
                            label={({ index, name, value, x, y }) => {
                                // Format the name: remove underscores and capitalize first letter
                                const formattedName = name
                                .replace(/_/g, " ") // remove underscores
                                .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize each word (or use only first letter if you prefer)
                                
                                return (
                                <text
                                    x={x}
                                    y={y}
                                    fill={colors[index % colors.length]}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize={10} // smaller text
                                >
                                    {`${formattedName} (${value})`}
                                </text>
                                );
                            }}
                            labelLine={true}
                            >
                            {data.map((entry, index) => (
                                <Cell key={index} fill={colors[index % colors.length]} />
                            ))}
                            </Pie>
                            <Tooltip
                                    contentStyle={{
                                        fontSize: '10px',     // 👈 reduce text size
                                        padding: '5px 8px',   // 👈 reduce padding
                                        borderRadius: '6px',  // rounded corners
                                        backgroundColor: '#fff',
                                        border: '1px solid #ccc'
                                    }}
                                    itemStyle={{
                                        fontSize: '10px',     // 👈 size of value lines
                                    }}
                                    labelStyle={{
                                    fontSize: '10px',     // 👈 size of label (title)
                                    fontWeight: 500
                                }}
                            />
                        </PieChart>
                        </ResponsiveContainer>


                    </div>
                </DashboardCard>
            );
        }

        function MultiPieCard({ title, data, colors, stat }) {
            return (
                <DashboardCard title={title} stat={stat}>
                    <div className="flex flex-col items-center w-full h-full p-4">
                        <div style={{ width: "100%", height: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        dataKey="value"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={0}
                                        outerRadius={40}
                                        paddingAngle={2}
                                        label={false}
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={index} fill={colors[index % colors.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap justify-center gap-2 mt-2 text-xs">
                            {data.map((entry, index) => (
                                <div key={index} className="flex items-center gap-1">
                                    <span
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: colors[index % colors.length] }}
                                    />
                                    <span>{`${entry.name} (${entry.value})`}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </DashboardCard>
            );
        }



        // Bar chart card
        function BarCard({ title, data, colors = ["#005fbe"], stat }) {
            return (
                <DashboardCard title={title} stat={stat}>
                    <div style={{ width: "100%", height: 150 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 20, right: 0, bottom: 10, left: 0 }}>
                                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value">
                                    {data.map((entry, index) => (
                                        <Cell key={index} fill={colors[index % colors.length]} />
                                    ))}
                                    <LabelList dataKey="value" position="top" className="text-xs fill-foreground" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </DashboardCard>
            );
        }


        function HorizontalBarCard({ title, data, colors = ["#005fbe"], stat }) {
            return (
                <DashboardCard title={title} stat={stat}>
                    <div className="flex flex-col items-center w-full h-full p-4">
                        <div style={{ width: "100%", height: 250 }}>
                            <ResponsiveContainer width="80%" height="80%">
                                <BarChart
                                    data={data}
                                    layout="vertical"
                                    margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                                    barCategoryGap={15}
                                >
                                    <XAxis type="number" allowDecimals={false} hide />
                                    <YAxis dataKey="name" type="category" width={0} tick={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            fontSize: '10px',     // 👈 reduce text size
                                            padding: '5px 8px',   // 👈 reduce padding
                                            borderRadius: '6px',  // rounded corners
                                            backgroundColor: '#fff',
                                            border: '1px solid #ccc'
                                        }}
                                        itemStyle={{
                                            fontSize: '10px',     // 👈 size of value lines
                                        }}
                                        labelStyle={{
                                            fontSize: '10px',     // 👈 size of label (title)
                                            fontWeight: 500
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={28}>
                                        {data.map((entry, index) => (
                                            <Cell key={index} fill={colors[index % colors.length]} />
                                        ))}
                                        <LabelList dataKey="value" position="insideRight" className="text-xs fill-white" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Labels */}
                        <div className="flex flex-wrap justify-center gap-3 mt-1 text-sm">
                            {data.map((entry, index) => (
                                <div key={index} className="flex items-center gap-1">
                                    <span
                                        className="w-3 h-3 rounded-sm"
                                        style={{ backgroundColor: colors[index % colors.length] }}
                                    />
                                    <span className="text-[10px]">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </DashboardCard>
            );
        }



        function LineCard({ title, data, stat }) {
            return (
                <DashboardCard title={title} stat={stat}>
                    <div style={{ width: "100%", height: 160 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                {/* <Legend /> */}
                                {/* Single line for your value */}
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ r: 4, stroke: "#3b82f6", strokeWidth: 2, fill: "#fff" }}
                                    activeDot={{ r: 6 }}
                                >
                                    <LabelList
                                        dataKey="value"
                                        position="top"
                                        className="text-xs fill-foreground"
                                    />
                                </Line>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </DashboardCard>
            );
        }

        function isValidLatLng(lat, lng) {
            return (
                typeof lat === "number" &&
                typeof lng === "number" &&
                !isNaN(lat) && !isNaN(lng) &&
                isFinite(lat) && isFinite(lng) &&
                Math.abs(lat) <= 90 && Math.abs(lng) <= 180
            );
        }

        function MarkerClusterLayer({ points }) {
            const map = useMap();
            React.useEffect(() => {
                const markerCluster = L.markerClusterGroup({
                    iconCreateFunction: (cluster) => {
                        const count = cluster.getChildCount();
                        const size = 20 + Math.log(count) * 10;
                        return L.divIcon({
                            html: `<div style="
                            background: rgba(255,78,46,0.6);
                            border: 2px solid #fff;
                            border-radius: 50%;
                            width:${size}px;
                            height:${size}px;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            color:#fff;
                            font-size:12px;
                            font-weight:bold;
                        ">${count}</div>`,
                            className: "custom-cluster-icon",
                            iconSize: [size, size],
                        });
                    },
                });

                points
                    .filter(pt => isValidLatLng(pt.latitude, pt.longitude))
                    .forEach((pt) => {
                        const radius = 4 + Math.log(Math.max(Number(pt.age) || 1, 1));
                        const circleMarker = L.circleMarker([pt.latitude, pt.longitude], {
                            radius,
                            fillColor: "#ff4e2e",
                            color: "#fff",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.6,
                        });
                        circleMarker.bindPopup(getPopupContent(pt));
                        markerCluster.addLayer(circleMarker);
                    });

                map.addLayer(markerCluster);
                return () => { map.removeLayer(markerCluster); }
            }, [map, points]);
            return null;
        }

        function PatientMap({ points }) {
            return (
                <MapContainer
                    center={[23.75, 90.36]}
                    zoom={7}
                    style={{ width: "100%", height: "100%" }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors & CartoDB'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                    <MarkerClusterLayer points={points} />
                </MapContainer>
            );
        }

        function getPopupContent(pt) {
            return `
            <div style="
            font-size:13px;
            min-width:220px;
            max-width:350px;
            max-height:230px;
            overflow-y:auto;
            font-family: 'Segoe UI', Arial, sans-serif;
            color:#2b3e50;
            ">
            <table style="
                width:100%;
                border-collapse:collapse;
                border:1px solid #e0e6ed;
            ">
                <tbody>
                ${[
                    ["Submission Date", pt.day || "-"],
                    ["Name (Suspected Case)", pt.nameofthepersonwithsuspectedcase || "-"],
                    ["Age", pt.age || "-"],
                    ["Sex", pt.sex || "-"],
                    ["Pregnant?", pt.preg || "-"],
                    ["Phone", pt.mobilenumber || "-"],
                    ["Disease(s)", Array.isArray(pt.disease) ? pt.disease.join(", ") : (pt.disease || "-")],
                    ["Suspected Disease?", pt.suspectedinthedisease || "-"],

                    ["Division", pt.division || "-"],
                    ["District", pt.district || "-"],
                    ["Upazila", pt.upazila || "-"],
                    ["Union", pt.union || "-"],
                    ["Ward", pt.ward || "-"],
                    ["village", pt.village || "-"],

                    ["Household ID", pt.hhid || "-"],
                    ["Household Head", pt.hhheadname || "-"],
                    ["Patient ID Type", pt.patientidtype || "-"],

                    ["Referred?", pt.referred || "-"],
                    ["Referral Place", normalizeFacility(pt.referralplace)],
                    ["If referred to govt", pt.ifreferredtogovt || "-"],

                    ["Organization", pt.organization || "-"],
                    ["Designation", pt.designation || "-"],
                    ["Staff Name", pt.nameofstaff || "-"],

                    ["Bednet Use During Sleep?", pt.bednetusepracticeduringsleep || "-"],
                    ["Handwashing Practice?", pt.handwashingpracticewithsoapwater || "-"],
                    ["Latrine Type", pt.typelatrineuse || "-"],
                    ["Mosquito Larvae", pt.presenceofmosquitolarvae || "-"],
                    ["Stagnant Water Breeding?", pt.presenceofstagnantwatermosquitobreedingsites || "-"],

                    ["Disaster Last 7 Days?", pt.didanydisasteroccurinlast7days || "-"],
                    ["Disaster Type(s)", Array.isArray(pt.whattypes) ? pt.whattypes.join(", ") : (pt.whattypes || "-")],

                    // ["Diagnosed Dengue", pt.noofalreadydiagnosedcasesofdengueinthehh ?? "-"],
                    // ["Diagnosed Malaria", pt.noofalreadydiagnosedcasesofmalariainthehh ?? "-"],
                    // ["Diagnosed AWD", pt.noofalreadydiagnosedcasesofawdinthehh ?? "-"],
                    ["Date", pt.date || "-"],
                    ["Remarks", pt.remarks || "-"],
                ].map(
                    ([label, value], i) => `
                        <tr style="background:${i % 2 === 0 ? "#f9fbfd" : "#ffffff"};">
                        <td style="
                            padding:6px 8px;
                            font-weight:600;
                            color:#4a6572;
                            border-bottom:1px solid #e0e6ed;
                            width:44%;
                        ">${label}:</td>
                        <td style="
                            padding:6px 8px;
                            border-bottom:1px solid #e0e6ed;
                            word-wrap:break-word;
                        ">${value}</td>
                        </tr>`
                ).join("")}
                </tbody>
            </table>
            </div>
            `;
        }

        function normalizeFacility(raw) {
            if (!raw) return "-";
            const v = raw.toLowerCase();
            if (
                [
                    "govt",
                    "government",
                    "community_clinic",
                    "upazila_health_complex",
                    "union_sub-centre",
                    "district_hospital",
                    "medical_college_hospital"
                ].some(x => v.includes(x))
            ) return "Govt";
            if (v.includes("brac")) return "BRAC";
            if (v.includes("priv") || v.includes("private")) return "Private";
            return raw;
        }

        function getFacilityFilterOptions(rows) {
            const found = new Set();
            rows.forEach(row => {
                // Mobile submission: organization field
                if (row.organization) {
                    const val = row.organization.toLowerCase();
                    if (val === "govt" || val === "government") found.add("Govt");
                    if (val === "brac") found.add("BRAC");
                    if (val.includes("priv")) found.add("Private");
                }
                // Enketo/web: referralplace field
                if (row.referralplace) {
                    const val = row.referralplace.toLowerCase();
                    if (val === "govt" || val === "government") found.add("Govt");
                    if (val === "brac") found.add("BRAC");
                    if (val.includes("priv")) found.add("Private");
                }
            });
            return Array.from(found);
        }

        function getOptions(rows, field) {
            const opts = new Set();
            rows.forEach(row => {
                const val = row[field];
                if (Array.isArray(val)) val.forEach(v => v && opts.add(v));
                else if (val) opts.add(val);
            });
            return Array.from(opts);
        }

        function MapFilterModal({ allRows, filterFields, filterState, setFilterState, onClose }) {
            const filterOptions = useMemo(() => {
                const opts = {};
                filterFields.forEach(f => {
                    opts[f.key] = getOptions(allRows, f.key);
                });
                return opts;
            }, [allRows, filterFields]);

            function handleChange(field, value) {
                setFilterState(prev => ({ ...prev, [field]: value }));
            }

            return (
                <div style={{
                    position: "fixed",
                    bottom: 60,
                    left: 30,
                    zIndex: 1500,
                    background: "white",
                    padding: "18px",
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                    minWidth: "240px"
                }}>
                    <strong>Map Filter</strong>
                    {filterFields.map(f => (
                        <div style={{ margin: "8px 0" }} key={f.key}>
                            <label style={{ fontSize: "14px" }}>{f.label}</label>
                            <select
                                style={{ width: "100%", marginTop: "3px", fontSize: "13.5px", background: "#F3F6F9" }}
                                value={filterState[f.key] || ""}
                                onChange={e => handleChange(f.key, e.target.value)}
                            >
                                <option value="">All</option>
                                {filterOptions[f.key].map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                    <div style={{ textAlign: "right", marginTop: "16px" }}>
                        <button onClick={onClose}
                            style={{
                                background: "#ff4e2e", color: "#fff", border: 0, borderRadius: "4px",
                                padding: "4px 12px", fontWeight: "bold"
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            );
        }