"use strict";

var dashGrid = function (el, opts) {
    var self = this;

    if (typeof opts === "undefined") {
        opts = {};
    }

    this.grid = $(el);
    this.cols = (typeof opts.cols !== "undefined" ? opts.cols : 4);
    this.rows = parseInt(Math.ceil(this.gridItem().length / this.cols));
    this.nodes = {};
    this.item = {
        width: (100 / this.cols),
        height: (typeof opts.height !== "undefined" ? opts.height : 200)
    };
    this.lastMax = null;

    this.gridHint().remove();
    this.hintNodes();
    this.mapItems();
    this.draggable(function (e) {
        if (typeof opts[e.type] !== "undefined") {
            opts[e.type]({
                item: e.item,
                itemList: self.gridItem()
            });
        }
    });
};

dashGrid.prototype.hintNodes = function () {
    var self = this;
    var lastHeight = 0;
    var lastRow = 0;

    this.gridItem().each(function (i, e) {
        if (typeof $(e).attr("style") !== "undefined") {
            var s = self.getStyles(e);
            var height = parseFloat(s.top) + parseFloat(s.height);

            if (lastHeight <= height) {
                lastHeight = height;
            }
        } else {
            var row = $(e).attr("data-row");
            if (typeof row !== "undefined") {
                if (lastRow <= parseInt(row)) {
                    lastRow = parseInt(row);
                }
            }
        }
    });

    if (parseInt(lastHeight / this.item.height) > 0) {
        this.rows = parseInt(lastHeight / this.item.height);
    }

    if (parseInt(lastRow) > this.rows) {
        this.rows = parseInt(lastRow);
    }

    for (var r = 0; r < (this.rows + 1); r++) {
        for (var c = 0; c < this.cols; c++) {
            var top = this.item.height * r;
            var left = this.item.width * c;

            this.nodes[r + "," + c ] = {"top": top + "px", "left": left + "%", "width": this.item.width + "%", "height": this.item.height + "px"}
        }
    }

    this.grid.css({"position": "relative", "height": (this.item.height * (this.rows + 1)) + "px"});

    return this.nodes;
};

dashGrid.prototype.gridItem = function (attr) {
    return $("#" + this.grid.get(0).id + " > .dash-grid-item" + (typeof attr !== "undefined" ? attr : ""));
};

dashGrid.prototype.gridHint = function (attr) {
    return $("#" + this.grid.get(0).id + " > .dash-grid-hint" + (typeof attr !== "undefined" ? attr : ""));
};

dashGrid.prototype.mapItems = function () {
    var self = this;
    var exist = [];

    this.gridItem().each(function (i, e) {
        var data = self.getData(e);

        if (typeof data.row === "undefined" || typeof data.col === "undefined") {
            exist.push(data.id);
        } else {
            var node = self.nodes[data.row + "," + data.col];

            if (data.mode == "max") {
                node.width = (self.item.width * 2) + "%";
                node.height = (self.item.height * 2) + "px";
            }

            self.gridItem("[data-id='" + data.id + "']").attr("data-row", data.row).attr("data-col", data.col).css(node);
        }
    });

    var i = 0;

    for (var r = 0; r < this.rows; r++) {
        for (var c = 0; c < this.cols; c++) {
            if (typeof exist[i] !== "undefined") {
                if (typeof this.gridItem("[data-row='" + r + "'][data-col='" + c + "']").get(0) === "undefined") {
                    this.gridItem("[data-id='" + exist[i] + "']").attr("data-row", r).attr("data-col", c).css(this.nodes[r + "," + c ]);
                    i++;
                }
            }
        }
    }

    this.grid.append('<div class="dash-grid-hint"></div>');
};

dashGrid.prototype.getData = function (el) {
    var data = {};

    if (typeof el !== "undefined") {
        data = $(el).data();
    }

    return data;
};

dashGrid.prototype.getStyles = function (el) {
    var css = {};

    if (typeof el !== "undefined") {
        $.each($(el).attr("style").split(";"), function (key, value) {
            if (value.trim() != "") {
                var p = value.trim().split(":")[0].trim();
                var v = value.trim().split(":")[1].trim();

                css[p] = v;
            }
        });
    }

    return css;
};

dashGrid.prototype.getAttributes = function (el) {
    var attr = {};

    if (typeof el !== "undefined") {
        $.each($(el)[0].attributes, function (index, attribute) {
            attr[attribute.name] = attribute.value;
        });
    }

    return attr;
};

dashGrid.prototype.dataItems = function () {
    var self = this;
    var item = [];

    this.gridItem().each(function (i, e) {
        var attr = self.getAttributes(e);

        item.push({
            "id": attr["data-id"],
            "mode": (typeof attr["data-mode"] !== "undefined") ? attr["data-mode"] : "min",
            "row": parseInt(attr["data-row"]),
            "col": parseInt(attr["data-col"])
        });
    });

    return item;
};

dashGrid.prototype.draggable = function (callback) {
    var self = this;

    if (this.grid.data("kendoDraggable")) {
        this.grid.data("kendoDraggable").destroy();
    }

    this.grid.kendoDraggable({
        filter: ".dash-grid-item",
        hint: function (element) {
            var w = $(element).width();
            var h = $(element).height();

            return element.clone().addClass("drag").css({"width": w, "height": h});
        },
        drag: function (e) {
            var drag = $(".dash-grid-item.drag").get(0);
            var dragData = self.getData(drag);
            var dragStyles = self.getStyles(drag);
            var dragY = (parseFloat(dragStyles.top) - self.grid.offset().top) + e.offsetY;
            var dragX = (parseFloat(dragStyles.left) - self.grid.offset().left) + e.offsetX;
            var dragTop = parseFloat(dragY);
            var dragLeft = parseFloat((dragX / self.grid.width()) * 100);
            var dragMode = (typeof dragData["mode"] !== "undefined") ? dragData["mode"] : "min";

            $.each(self.nodes, function (key, node) {
                if ((parseFloat(dragTop) >= parseFloat(node.top) && parseFloat(dragTop) <= (parseFloat(node.top) + parseFloat(node.height)))) {
                    if ((parseFloat(dragLeft) >= parseFloat(node.left) && parseFloat(dragLeft) <= (parseFloat(node.left) + parseFloat(node.width)))) {
                        var r = parseFloat(key.split(",")[0]);
                        var c = parseFloat(key.split(",")[1]);

                        if (dragMode == "max") {
                            node.width = (self.item.width * 2) + "%";
                            node.height = (self.item.height * 2) + "px";
                        } else {
                            node.width = (self.item.width * 1) + "%";
                            node.height = (self.item.height * 1) + "px";
                        }

                        self.gridHint().attr("data-row", r).attr("data-col", c).css(node);
                    }
                }
            });
        },
        dragend: function (e) {
            var hint = self.gridHint().get(0);
            var hintAttr = self.getAttributes(hint);
            var hintStyles = self.getStyles(hint);
            var hintRow = parseFloat(hintAttr["data-row"]);
            var hintCol = parseFloat(hintAttr["data-col"]);
            var hintMode = (typeof hintAttr["data-mode"] !== "undefined") ? hintAttr["data-mode"] : "min";

            var drag = e.currentTarget.get(0);
            var dragAttr = self.getAttributes(drag);
            var dragStyles = self.getStyles(drag);
            var dragRow = parseFloat(dragAttr["data-row"]);
            var dragCol = parseFloat(dragAttr["data-col"]);
            var dragMode = (typeof dragAttr["data-mode"] !== "undefined") ? dragAttr["data-mode"] : "min";

            var drop = self.gridItem("[data-row='" + hintRow + "'][data-col='" + hintCol + "']").get(0);
            var dropAttr = self.getAttributes(drop);
            var dropStyles = self.getStyles(drop);
            var dropRow = parseFloat(dropAttr["data-row"]);
            var dropCol = parseFloat(dropAttr["data-col"]);
            var dropMode = (typeof dropAttr["data-mode"] !== "undefined") ? dropAttr["data-mode"] : "min";

            if (dragMode == "max" && hintCol >= (self.cols - 1)) {
                self.gridHint().removeAttr("style");
                return false;
            }

            $(drag).attr("data-row", hintRow).attr("data-col", hintCol).css(hintStyles);

            if (typeof drop !== "undefined") {
                if (dragMode == dropMode) {
                    $(drop).attr("data-row", dragRow).attr("data-col", dragCol).css(dragStyles);
                }
            } else {
                if (self.checkStack(drag) == true) {
                    $(drag).attr("data-row", dragRow).attr("data-col", dragCol).css(dragStyles);
                    self.gridHint().removeAttr("style");
                    return false;
                }
            }

            self.collision(drag);
            self.hintNodes();
            self.gridHint().removeAttr("style");

            $(".dash-grid-item.drag").hide();

            callback({
                type: "drag",
                item: drag
            });
        }
    });

    this.grid.on("click", ".resize", function (e) {
        var el = $(e.currentTarget).parent().get(0);

        self.resizable(el);
        self.hintNodes();

        callback({
            type: "resize",
            item: el
        });
    });
};

dashGrid.prototype.resizable = function (el) {
    var self = this;
    var style = this.getStyles(el);
    var attr = this.getAttributes(el);
    var mode = (typeof attr["data-mode"] !== "undefined") ? attr["data-mode"] : "min";

    if (attr["data-id"] != this.lastMax) {
        this.gridItem().each(function (i, e) {
            $(e).removeAttr("data-x-row");
            $(e).removeAttr("data-x-col");
        });
    }

    if (mode == "min") {
        mode = "max";
        style.width = (parseFloat(style.width) * 2) + "%";
        style.height = (parseFloat(style.height) * 2) + "px";

        if (parseFloat(attr["data-col"]) == (this.cols - 1)) {
            $(el).attr("data-col", (this.cols - 2));
            $(el).attr("data-x-col", (this.cols - 1));

            style.left = this.item.width * (this.cols - 2) + "%";
        }

        this.gridItem().each(function (i, e) {
            $(e).removeAttr("data-x-row");
        });

        this.lastMax = attr["data-id"];
    } else {
        mode = "min";
        style.width = (parseFloat(style.width) / 2) + "%";
        style.height = (parseFloat(style.height) / 2) + "px";

        if (typeof attr["data-x-col"] !== "undefined") {
            $(el).attr("data-col", $(el).attr("data-x-col"));
            $(el).removeAttr("data-x-col");

            style.left = this.item.width * (this.cols - 1) + "%";
        }

        this.gridItem().each(function (i, e) {
            var x = $(e).attr("data-x-row");
            var s = self.getStyles(e);

            if (typeof x !== "undefined") {
                s.top = self.item.height * x;

                $(e).attr("data-row", x).css(s);
                $(e).removeAttr("data-x-row");
            }
        });
    }

    $(el).attr("data-mode", mode).css(style);

    this.collision(el);
};

dashGrid.prototype.collision = function (el) {
    var self = this;
    var main = this.getAttributes(el);
    var mainStyles = this.getStyles(el);
    var mainMode = (typeof main["data-mode"] !== "undefined") ? main["data-mode"] : "min";

    var ee = [];

    for (var r = 0; r < this.rows; r++) {
        for (var c = 0; c < this.cols; c++) {
            this.gridItem("[data-row='" + r + "'][data-col='" + c + "']").each(function (i, e) {
                var other = self.getAttributes(e);
                var otherStyles = self.getStyles(e);
                var otherMode = (typeof other["data-mode"] !== "undefined") ? other["data-mode"] : "min";

                if (other["data-id"] != main["data-id"]) {
                    if ((parseFloat(otherStyles.top) >= parseFloat(mainStyles.top) && parseFloat(otherStyles.top) < (parseFloat(mainStyles.top) + parseFloat(mainStyles.height)))) {
                        if ((parseFloat(otherStyles.left) >= parseFloat(mainStyles.left) && parseFloat(otherStyles.left) < (parseFloat(mainStyles.left) + parseFloat(mainStyles.width)))) {
                            var row = parseFloat(other["data-row"]) + 1;

                            if (mainMode == "max" && parseFloat(other["data-row"]) == parseFloat(main["data-row"])) {
                                row = parseFloat(other["data-row"]) + 2;
                            }

                            otherStyles.top = self.item.height * row;

                            if (typeof other["data-x-row"] !== "undefined") {
                                $(e).attr("data-row", row).css(otherStyles);
                            } else {
                                $(e).attr("data-row", row).attr("data-x-row", parseFloat(other["data-row"])).css(otherStyles);
                            }

                            ee.push($(e));
                        }
                    }

                    if (((parseFloat(otherStyles.top) + self.item.height) >= parseFloat(mainStyles.top) && (parseFloat(otherStyles.top) + self.item.height) < (parseFloat(mainStyles.top) + parseFloat(mainStyles.height)))) {
                        if ((parseFloat(otherStyles.left) >= parseFloat(mainStyles.left) && parseFloat(otherStyles.left) < (parseFloat(mainStyles.left) + parseFloat(mainStyles.width)))) {
                            if (otherMode == "max" && mainMode == "max") {
                                var row = parseFloat(other["data-row"]) + 3;

                                otherStyles.top = self.item.height * row;

                                if (typeof other["data-x-row"] !== "undefined") {
                                    $(e).attr("data-row", row).css(otherStyles);
                                } else {
                                    $(e).attr("data-row", row).attr("data-x-row", parseFloat(other["data-row"])).css(otherStyles);
                                }

                                ee.push($(e));
                            }
                        }
                    }

                    if ((parseFloat(otherStyles.top) >= parseFloat(mainStyles.top) && parseFloat(otherStyles.top) < (parseFloat(mainStyles.top) + parseFloat(mainStyles.height)))) {
                        if (((parseFloat(otherStyles.left) + self.item.width) >= parseFloat(mainStyles.left) && (parseFloat(otherStyles.left) + self.item.width) < (parseFloat(mainStyles.left) + parseFloat(mainStyles.width)))) {
                            if (otherMode == "max" && mainMode == "max") {
                                var row = parseFloat(other["data-row"]) + 2;

                                otherStyles.top = self.item.height * row;

                                if (typeof other["data-x-row"] !== "undefined") {
                                    $(e).attr("data-row", row).css(otherStyles);
                                } else {
                                    $(e).attr("data-row", row).attr("data-x-row", parseFloat(other["data-row"])).css(otherStyles);
                                }

                                ee.push($(e));
                            }
                        }
                    }

                    if (((parseFloat(otherStyles.top) + self.item.height) >= parseFloat(mainStyles.top) && (parseFloat(otherStyles.top) + self.item.height) < (parseFloat(mainStyles.top) + parseFloat(mainStyles.height)))) {
                        if (((parseFloat(otherStyles.left) + self.item.width) >= parseFloat(mainStyles.left) && (parseFloat(otherStyles.left) + self.item.width) < (parseFloat(mainStyles.left) + parseFloat(mainStyles.width)))) {
                            if (otherMode == "max" && mainMode == "max") {
                                var row = parseFloat(other["data-row"]) + 3;

                                otherStyles.top = self.item.height * row;

                                if (typeof other["data-x-row"] !== "undefined") {
                                    $(e).attr("data-row", row).css(otherStyles);
                                } else {
                                    $(e).attr("data-row", row).attr("data-x-row", parseFloat(other["data-row"])).css(otherStyles);
                                }

                                ee.push($(e));
                            }
                        }
                    }
                }
            });
        }
    }

    $(ee).each(function (i, e) {
        self.collision(e);
        self.hintNodes();
    });
};

dashGrid.prototype.checkStack = function (el) {
    var self = this;
    var main = this.getAttributes(el);
    var mainStyles = this.getStyles(el);
    var mainMode = (typeof main["data-mode"] !== "undefined") ? main["data-mode"] : "min";

    var stack = false;

    for (var r = 0; r < this.rows; r++) {
        for (var c = 0; c < this.cols; c++) {
            this.gridItem("[data-row='" + r + "'][data-col='" + c + "']").each(function (i, e) {
                var other = self.getAttributes(e);
                var otherStyles = self.getStyles(e);
                var otherMode = (typeof other["data-mode"] !== "undefined") ? other["data-mode"] : "min";

                if (otherMode == "max" && other["data-id"] != main["data-id"]) {
                    if ((parseFloat(mainStyles.top) >= parseFloat(otherStyles.top) && parseFloat(mainStyles.top) < (parseFloat(otherStyles.top) + parseFloat(otherStyles.height)))) {
                        if ((parseFloat(mainStyles.left) >= parseFloat(otherStyles.left) && parseFloat(mainStyles.left) < (parseFloat(otherStyles.left) + parseFloat(otherStyles.width)))) {
                            stack = true;
                        }
                    }
                }
            });
        }
    }

    return stack;
};

$.fn.dashGrid = function (opts) {
    this.items = function () {
        var nodes = [];

        $.each(this[0].children, function (_, item) {
            var attr = {};

            $.each($(item)[0].attributes, function (_, attribute) {
                attr[attribute.name] = attribute.value;
            });

            attr["class"] = undefined;
            attr["style"] = undefined;
            attr["data-x-row"] = undefined;
            attr["data-x-col"] = undefined;
            attr = JSON.parse(JSON.stringify(attr));

            if (typeof attr["data-id"] !== "undefined") {
                nodes.push(attr);
            }
        });

        return nodes;
    };

    this.destroy = function () {
        $(this).unbind();
        $(this).removeData("dashGrid");
        $(this).removeAttr("style");
        $(this).removeAttr("data-role");

        $.each(this[0].children, function (_, item) {
            $(item).removeAttr("style");
            $(item).removeAttr("data-row");
            $(item).removeAttr("data-col");
            $(item).removeAttr("data-x-row");
            $(item).removeAttr("data-x-col");
            $(item).removeAttr("data-mode");

            $(item).removeData("row");
            $(item).removeData("col");
            $(item).removeData("x-row");
            $(item).removeData("x-col");
            $(item).removeData("mode");
        });
    };

    return this.each(function () {
        if (!$(this).data("dashGrid")) {
            $(this).data("dashGrid", new dashGrid(this, opts));
        }
    });
};